const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(cors()); // Permite que o seu site fale com o bot

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false, //chrome view
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
  }
});

// --- LOGICA DO WHATSAPP ---
client.on('qr', qr => qrcode.generate(qr, {small: true}));
client.on('ready', () => console.log('✅ Bot conectado! Pronto para receber comandos do site.'));

// --- ROTA PARA O SITE ENVIAR MENSAGEM ---
app.post('/enviar', async (req, res) => {
  const { numero, mensagem } = req.body;
  try {
    const limpo = String(numero).replace(/\D/g, '');
    const chatId = `${limpo}@c.us`;

    // --- TRUQUE PARA O ERRO DE LID ---
    // Em vez de enviar direto, pedimos para o bot "buscar" o contato
    // Isso força o WhatsApp a gerar o LID internamente
    const contato = await client.getContactById(chatId);

    // Agora enviamos usando o ID que o próprio WhatsApp confirmou
    await client.sendMessage(contato.id._serialized, mensagem);

    console.log(`[CRM] Mensagem enviada para ${contato.id._serialized}`);
    res.json({ status: 'Sucesso' });
  } catch (e) {
    console.error('Erro ao enviar:', e);
    res.status(500).json({ status: 'Erro', detalhe: e.message });
  }
});

client.initialize();
app.listen(3000, () => console.log('🌐 Servidor do CRM rodando na porta 3000'));
