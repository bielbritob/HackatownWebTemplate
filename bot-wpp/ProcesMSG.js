const { getWhatsAppClient } = require('./clientRegistry');
const {
  normalizeChatId,
  getAtendimentoStatus,
  ensureAtendimentoRow,
  salvarMensagem,
  persistBotSessao,
  loadBotSessaoRow,
  atualizarAtendimento
} = require('./atendimentoDb');

const sessoes = new Map();

function invalidateSessaoLocal(numero) {
  const id = normalizeChatId(numero);
  sessoes.delete(id);
}

async function getSessao(numero) {
  const id = normalizeChatId(numero);
  if (sessoes.has(id)) return sessoes.get(id);

  const row = await loadBotSessaoRow(id);
  if (row) {
    const s = {
      etapa: row.etapa || 'menu',
      produto: row.produto,
      historico: Array.isArray(row.historico) ? row.historico : [],
      nome: null,
      preco: null
    };
    sessoes.set(id, s);
    return s;
  }

  const fresh = {
    etapa: 'inicio',
    produto: null,
    historico: [],
    nome: null,
    preco: null
  };
  sessoes.set(id, fresh);
  return fresh;
}

async function replyBot(msg, sessao, texto) {
  const id = normalizeChatId(msg.from);
  await salvarMensagem(id, 'bot', texto);
  sessao.historico.push({ de: 'bot', texto, hora: new Date().toISOString() });
  await persistBotSessao(id, sessao.produto, sessao.etapa, sessao.historico);
  await msg.reply(texto);
}

async function avisarAtendente(msg, sessao) {
  const id = normalizeChatId(msg.from);
  const resumo = sessao.historico
    .filter((h) => h && h.texto)
    .slice(-8)
    .map((h) => (h.de === 'cliente' ? `→ Cliente: "${h.texto}"` : `→ Bot: "${h.texto}"`))
    .join('\n');

  const aviso =
    `🔔 *NOVO LEAD* ${sessao.etapa === 'quente' ? '🔥 QUENTE' : '👤 ATENDENTE'}\n\n` +
    `👤 Número: ${id.replace('@c.us', '')}\n` +
    `📦 Produto: ${sessao.produto || 'Não identificado'}\n` +
    `🕐 ${new Date().toLocaleString('pt-BR')}\n\n` +
    `📋 *Histórico recente:*\n${resumo || '(sem histórico)'}\n\n` +
    `⚡ Intenção: ${sessao.etapa === 'quente' ? 'COMPRA' : 'FALAR COM HUMANO'}`;

  const alerta = process.env.WHATSAPP_ALERT_NUMBER;
  if (alerta) {
    try {
      const c = getWhatsAppClient();
      if (c) await c.sendMessage(normalizeChatId(alerta), aviso);
    } catch (e) {
      console.error('Falha ao avisar atendente no WhatsApp:', e.message);
    }
  }

  await atualizarAtendimento(id, {
    status: 'aguardando',
    temperatura: 'quente',
    produto: sessao.produto || undefined
  });
  await ensureAtendimentoRow(id, sessao.produto);
}

async function enviarBoasVindas(msg, sessao) {
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const produto = sessao.produto ? `o produto *${sessao.produto}*` : 'nossos produtos';
  const texto =
    `${saudacao}! 👋 Que ótimo que você se interessou por ${produto}!\n\n` +
    `Como posso te ajudar?\n\n` +
    `1️⃣ Ver o preço\n` +
    `2️⃣ Como funciona?\n` +
    `3️⃣ Ver fotos\n` +
    `4️⃣ Prazo de entrega\n` +
    `5️⃣ Quero comprar\n` +
    `6️⃣ Falar com atendente\n\n` +
    `_Digite o número da opção_ 👆`;

  await replyBot(msg, sessao, texto);
}

async function processarMenu(msg, sessao, texto) {
  const precoTxt = sessao.preco || 'consulte valores no site ou com o atendente';

  switch (texto) {
    case '1':
      sessao.historico.push({ interesse: 'preço', hora: new Date().toISOString() });
      await persistBotSessao(msg.from, sessao.produto, sessao.etapa, sessao.historico);
      await replyBot(
        msg,
        sessao,
        `💰 O *${sessao.produto || 'produto'}* — *${precoTxt}*\n\nPosso te ajudar com mais alguma coisa?\n\n5️⃣ Quero comprar\n6️⃣ Falar com atendente`
      );
      break;

    case '2':
      await replyBot(
        msg,
        sessao,
        `⚙️ *Como funciona* o ${sessao.produto || 'produto'}:\n\n` +
          `Funciona conforme descrito na vitrine. Posso detalhar entrega e pagamento com o atendente.\n\n` +
          `Quer saber mais?\n3️⃣ Ver fotos\n5️⃣ Quero comprar`
      );
      break;

    case '3':
      await replyBot(
        msg,
        sessao,
        `📸 As fotos estão na página do produto na vitrine. Se precisar de mais imagens, use a opção *6* e fale com um atendente.`
      );
      break;

    case '4':
      await replyBot(
        msg,
        sessao,
        `🚚 *Prazo de entrega:* depende da região. Um atendente confirma o prazo exato para o seu endereço.\n\n6️⃣ Falar com atendente`
      );
      break;

    case '5':
      sessao.etapa = 'quente';
      await persistBotSessao(msg.from, sessao.produto, sessao.etapa, sessao.historico);
      await replyBot(
        msg,
        sessao,
        `🔥 Ótimo! Um atendente humano vai continuar por aqui com todo o contexto da conversa.\n\n_Aguarde um momento..._ ⏳`
      );
      await avisarAtendente(msg, sessao);
      break;

    case '6':
      sessao.etapa = 'humano';
      await persistBotSessao(msg.from, sessao.produto, sessao.etapa, sessao.historico);
      await replyBot(
        msg,
        sessao,
        `👤 Vou encaminhar para um atendente humano com todo o histórico deste chat.\n\n_Aguarde um momento..._ 🙏`
      );
      await avisarAtendente(msg, sessao);
      break;

    default:
      await replyBot(
        msg,
        sessao,
        `Não entendi 😅 Digite apenas o *número* da opção:\n\n1️⃣ Preço  2️⃣ Como funciona  3️⃣ Fotos\n4️⃣ Entrega  5️⃣ Comprar  6️⃣ Atendente`
      );
  }
}

async function processarMensagem(msg) {
  const texto = (msg.body || '').trim();
  if (!texto) return;

  const id = normalizeChatId(msg.from);

  await salvarMensagem(id, 'cliente', texto);

  const at = await getAtendimentoStatus(id);
  if (at.status === 'humano' || at.status === 'aguardando') {
    return;
  }

  const sessao = await getSessao(id);
  sessao.historico.push({ de: 'cliente', texto, hora: new Date().toISOString() });

  if (sessao.etapa === 'inicio') {
    const prodMatch = texto.match(/produto:\s*\*?(.+?)\*?\s*\(/i);
    if (prodMatch) {
      sessao.produto = prodMatch[1].trim();
    }
    const priceMatch = texto.match(/\(\s*(R\$[\d.,\s]+)\s*\)/i);
    if (priceMatch) {
      sessao.preco = priceMatch[1].trim();
    }
    await ensureAtendimentoRow(id, sessao.produto);
    if (sessao.produto) {
      await atualizarAtendimento(id, { produto: sessao.produto });
    }
    await enviarBoasVindas(msg, sessao);
    sessao.etapa = 'menu';
    await persistBotSessao(id, sessao.produto, sessao.etapa, sessao.historico);
    return;
  }

  if (sessao.etapa === 'menu') {
    await processarMenu(msg, sessao, texto);
  }
}

module.exports = { processarMensagem, invalidateSessaoLocal };
