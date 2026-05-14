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

// Resolve o número real do contato (evita LID)
async function getNumeroReal(msg) {
  try {
    const contato = await msg.getContact();
    const nome = contato.pushname || contato.name || null;
    const idSerializer = contato.id._serialized;
    const idUser = contato.id.user;

    let numero;
    if (idUser && idUser.length <= 15) {
      numero = `${idUser}@c.us`;
    } else {
      const c = getWhatsAppClient();
      const chats = await c.getChats();
      const chat = chats.find(ch =>
        ch.id._serialized === idSerializer ||
        ch.id._serialized === normalizeChatId(msg.from)
      );
      numero = chat ? chat.id._serialized : normalizeChatId(msg.from);
    }

    console.log('[getNumeroReal] nome:', nome, '| numero:', numero);
    return { numero, nome };
  } catch (e) {
    console.error('[getNumeroReal] erro:', e.message);
    return { numero: normalizeChatId(msg.from), nome: null };
  }
}

function invalidateSessaoLocal(numero) {
  sessoes.delete(normalizeChatId(numero));
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

  const fresh = { etapa: 'inicio', produto: null, historico: [], nome: null, preco: null };
  sessoes.set(id, fresh);
  return fresh;
}

async function replyBot(msg, sessao, texto) {
  const { numero: id } = await getNumeroReal(msg);
  await salvarMensagem(id, 'bot', texto);
  sessao.historico.push({ de: 'bot', texto, hora: new Date().toISOString() });
  await persistBotSessao(id, sessao.produto, sessao.etapa, sessao.historico);
  await msg.reply(texto);
}

async function avisarAtendente(msg, sessao) {
  const { numero: id } = await getNumeroReal(msg);

  const resumo = sessao.historico
    .filter(h => h && h.texto)
    .slice(-8)
    .map(h => (h.de === 'cliente' ? `→ Cliente: "${h.texto}"` : `→ Bot: "${h.texto}"`))
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
  const produto = sessao.produto ? `*${sessao.produto}*` : 'um dos nossos produtos';

  const texto =
    `${saudacao}! ⚡ Seja bem-vindo à *3A Engenharia — Tudo em Eletricidade!*\n\n` +
    `Que ótimo que você se interessou por ${produto}! 😊\n\n` +
    `Como posso te ajudar hoje?\n\n` +
    `1️⃣ Ver o preço\n` +
    `2️⃣ Como funciona / especificações\n` +
    `3️⃣ Ver fotos\n` +
    `4️⃣ Prazo e área de entrega\n` +
    `5️⃣ Quero comprar\n` +
    `6️⃣ Falar com um atendente\n\n` +
    `_Digite o número da opção_ 👆`;

  await replyBot(msg, sessao, texto);
}

async function processarMenu(msg, sessao, texto) {
  const prod = sessao.produto || 'produto';
  const precoTxt = sessao.preco || 'a combinar com o atendente';

  switch (texto) {
    case '1':
      sessao.historico.push({ interesse: 'preço', hora: new Date().toISOString() });
      await persistBotSessao(msg.from, sessao.produto, sessao.etapa, sessao.historico);
      await replyBot(
        msg, sessao,
        `💰 *Preço do ${prod}:* ${precoTxt}\n\n` +
        `Trabalhamos com os melhores fornecedores do mercado para garantir qualidade e o melhor preço da região! 🏆\n\n` +
        `Posso te ajudar com mais alguma coisa?\n\n` +
        `5️⃣ Quero comprar\n` +
        `6️⃣ Falar com atendente`
      );
      break;

    case '2':
      await replyBot(
        msg, sessao,
        `⚙️ *Especificações do ${prod}:*\n\n` +
        `As especificações técnicas completas estão disponíveis na nossa vitrine. ` +
        `Para dúvidas mais detalhadas — como projetos elétricos, subestações ou dimensionamento — ` +
        `nossos técnicos especializados estão prontos para te orientar! 👷\n\n` +
        `3️⃣ Ver fotos\n` +
        `5️⃣ Quero comprar\n` +
        `6️⃣ Falar com um técnico`
      );
      break;

    case '3':
      await replyBot(
        msg, sessao,
        `📸 As fotos do *${prod}* estão disponíveis na nossa vitrine online.\n\n` +
        `Se precisar de imagens adicionais ou detalhes específicos do produto, ` +
        `fale com um dos nossos atendentes — são rápidos e prestativos! 😄\n\n` +
        `6️⃣ Falar com atendente`
      );
      break;

    case '4':
      await replyBot(
        msg, sessao,
        `🚚 *Entrega da 3A Engenharia:*\n\n` +
        `Atendemos principalmente *Porto Velho - RO* com entrega rápida, ágil e segura! ✅\n\n` +
        `O prazo exato depende da sua localização e disponibilidade do produto em estoque. ` +
        `Um atendente confirma tudo rapidinho para você:\n\n` +
        `6️⃣ Falar com atendente`
      );
      break;

    case '5':
      sessao.etapa = 'quente';
      await persistBotSessao(msg.from, sessao.produto, sessao.etapa, sessao.historico);
      await replyBot(
        msg, sessao,
        `🔥 Ótima escolha! O *${prod}* é um produto de qualidade garantida.\n\n` +
        `Estou passando todo o histórico da nossa conversa para um atendente humano que vai finalizar seu pedido com segurança. 🤝\n\n` +
        `_Aguarde um momento..._ ⏳`
      );
      await avisarAtendente(msg, sessao);
      break;

    case '6':
      sessao.etapa = 'humano';
      await persistBotSessao(msg.from, sessao.produto, sessao.etapa, sessao.historico);
      await replyBot(
        msg, sessao,
        `👷 Claro! Estou encaminhando você para um de nossos atendentes especializados.\n\n` +
        `Todo o histórico desta conversa vai junto, então não precisa repetir nada. 😊\n\n` +
        `_Aguarde um instante..._ 🙏\n\n` +
        `📍 Se preferir, também pode nos visitar:\n` +
        `*Rua Venezuela, 1206 — Nova Porto Velho*\n` +
        `📞 (69) 3026-2692 / 3225-4489`
      );
      await avisarAtendente(msg, sessao);
      break;

    default:
      await replyBot(
        msg, sessao,
        `Não entendi 😅 Por favor, digite apenas o *número* da opção:\n\n` +
        `1️⃣ Preço\n` +
        `2️⃣ Especificações\n` +
        `3️⃣ Fotos\n` +
        `4️⃣ Prazo de entrega\n` +
        `5️⃣ Quero comprar\n` +
        `6️⃣ Falar com atendente`
      );
  }
}

async function processarMensagem(msg) {
  const texto = (msg.body || '').trim();
  if (!texto) return;

  const { numero: id, nome } = await getNumeroReal(msg);
  await salvarMensagem(id, 'cliente', texto);

  const at = await getAtendimentoStatus(id);
  if (at.status === 'humano' || at.status === 'aguardando') return;

  const sessao = await getSessao(id);

  if (nome && !sessao.nome) sessao.nome = nome;

  sessao.historico.push({ de: 'cliente', texto, hora: new Date().toISOString() });

  if (sessao.etapa === 'inicio') {
    const prodMatch = texto.match(/produto:\s*(.+?)\s*\(/i);
    if (prodMatch) {
      sessao.produto = prodMatch[1].trim().replace(/\*/g, '');
    }

    const priceMatch = texto.match(/\(\s*(R\$[\d.,\s]+)\s*\)/i);
    if (priceMatch) sessao.preco = priceMatch[1].trim();

    console.log(`[Bot] Produto: ${sessao.produto} | Preço: ${sessao.preco}`);

    await ensureAtendimentoRow(id, sessao.produto, nome);
    if (sessao.produto) await atualizarAtendimento(id, { produto: sessao.produto });

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
