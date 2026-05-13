const path = require('path');
const express = require('express');
const cors = require('cors');
const { getWhatsAppClient } = require('./clientRegistry');
const {
  normalizeChatId,
  listarConversas,
  listarMensagens,
  marcarMensagensClienteLidas,
  salvarMensagem,
  atualizarAtendimento,
  getAtendimentoStatus,
  resetBotEtapaMenu
} = require('./atendimentoDb');
const { invalidateSessaoLocal } = require('./ProcesMSG');

const PORT = Number(process.env.PORT) || 3000;

function createApp() {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());

  const painelDir = path.join(__dirname, '..', 'painel-atendimento');
  app.use('/painel-atendimento', express.static(painelDir));

  app.get('/api/health', (req, res) => {
    const c = getWhatsAppClient();
    res.json({ ok: true, whatsappReady: !!(c && c.info) });
  });

  app.get('/api/conversas', async (req, res) => {
    try {
      const rows = await listarConversas();
      res.json(rows);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.get('/api/conversa/:numero', async (req, res) => {
    try {
      const numero = normalizeChatId(req.params.numero);
      const nome = req.query.nome || 'Cliente'; //faz query para buscar nome, senao seta como "cliente"
      //console.log(nome)
      const [mensagens, atendimento] = await Promise.all([
        listarMensagens(numero),
        getAtendimentoStatus(numero)
      ]);
      await marcarMensagensClienteLidas(numero);
      res.json({ numero, atendimento, mensagens, nome });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.post('/api/responder', async (req, res) => {
    try {
      // 1. Extrair os dados da requisição
      const { numero, texto } = req.body || {};

      // 2. Validar se os dados chegaram
      if (!numero || !texto || !String(texto).trim()) {
        return res.status(400).json({ error: 'numero e texto são obrigatórios' });
      }

      // 3. Definir o ID e verificar status
      const id = normalizeChatId(numero);
      const at = await getAtendimentoStatus(id);

      if (at.status !== 'humano') {
        return res.status(409).json({
          error: 'Assuma o atendimento antes de enviar mensagens ao cliente.'
        });
      }

      const c = getWhatsAppClient();
      if (!c || !c.info) {
        return res.status(503).json({ error: 'WhatsApp ainda não está pronto' });
      }

      // 4. Salvar no banco de dados local
      await salvarMensagem(id, 'atendente', String(texto).trim());

      // 5. Enviar via WhatsApp (Envio Direto para evitar erro de LID)
      try {
        // Substituido
        const chatId = id.includes('@c.us') ? id : `${id}@c.us`;

      // Tenta pelo chat existente primeiro (evita LID)
        const chats = await c.getChats();
        const chatExistente = chats.find(ch => ch.id._serialized === chatId);

        if (chatExistente) {
          await chatExistente.sendMessage(String(texto).trim());
        } else {
          await c.sendMessage(chatId, String(texto).trim());
        }

        res.json({ ok: true });

      } catch (sendError) {
        console.error("Erro no envio direto:", sendError);
        res.status(500).json({ error: "Erro técnico ao disparar mensagem. Tente reiniciar o bot." });
      }

    } catch (e) {
      console.error("Erro na rota responder:", e);
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.post('/api/assumir/:numero', async (req, res) => {
    try {
      const id = normalizeChatId(req.params.numero);
      await atualizarAtendimento(id, { status: 'humano' });
      res.json({ ok: true, numero: id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.post('/api/resolver/:numero', async (req, res) => {
    try {
      const id = normalizeChatId(req.params.numero);
      await atualizarAtendimento(id, { status: 'bot' });
      await resetBotEtapaMenu(id);
      invalidateSessaoLocal(id);
      res.json({ ok: true, numero: id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e.message) });
    }
  });

  return app;
}

function startServer() {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`🌐 API + painel estáticos em http://localhost:${PORT}`);
    console.log(`   Painel: http://localhost:${PORT}/painel-atendimento/index.html`);
  });
}

module.exports = { createApp, startServer, PORT };
