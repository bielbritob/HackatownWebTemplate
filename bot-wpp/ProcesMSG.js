// sessoes.js — guarda estado de cada conversa em memória
const sessoes = new Map();

function getSessao(numero) {
  if (!sessoes.has(numero)) {
    sessoes.set(numero, {
      etapa: 'inicio',
      produto: null,
      historico: [],
      nome: null
    });
  }
  return sessoes.get(numero);
}

async function processarMensagem(msg) {
  const numero = msg.from;
  const texto = msg.body.trim();
  const sessao = getSessao(numero);

  // Salva no histórico
  sessao.historico.push({ de: 'cliente', texto, hora: new Date() });

  // Detecta produto se vier do site
  if (sessao.etapa === 'inicio') {
    const match = texto.match(/produto:\s*\*?(.+?)\*?\s*\(/i);
    if (match) {
      sessao.produto = match[1].trim();
    }
    await enviarBoasVindas(msg, sessao);
    sessao.etapa = 'menu';
    return;
  }

  // Processa resposta do menu
  if (sessao.etapa === 'menu') {
    await processarMenu(msg, sessao, texto);
  }
}

async function enviarBoasVindas(msg, sessao) {
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const produto = sessao.produto ? `o produto *${sessao.produto}*` : 'nossos produtos';

  await msg.reply(
    `${saudacao}! 👋 Que ótimo que você se interessou por ${produto}!\n\n` +
    `Como posso te ajudar?\n\n` +
    `1️⃣ Ver o preço\n` +
    `2️⃣ Como funciona?\n` +
    `3️⃣ Ver fotos\n` +
    `4️⃣ Prazo de entrega\n` +
    `5️⃣ Quero comprar\n` +
    `6️⃣ Falar com atendente\n\n` +
    `_Digite o número da opção_ 👆`
  );
}

async function processarMenu(msg, sessao, texto) {
  switch (texto) {
    case '1':
      sessao.historico.push({ interesse: 'preço' });
      await msg.reply(`💰 O *${sessao.produto}* está por *R$ 1.890,00*\n\nPosso te ajudar com mais alguma coisa?\n\n5️⃣ Quero comprar\n6️⃣ Falar com atendente`);
      break;

    case '2':
      await msg.reply(`⚙️ *Como funciona o ${sessao.produto}:*\n\n[descrição do produto aqui]\n\nQuer saber mais?\n3️⃣ Ver fotos\n5️⃣ Quero comprar`);
      break;

    case '5':
      sessao.etapa = 'quente';
      await msg.reply(`🔥 Ótimo! Vou chamar um atendente agora, ele já sabe o que você precisa!\n\n_Aguarde um momento..._ ⏳`);
      await avisarAtendente(msg, sessao);
      break;

    case '6':
      sessao.etapa = 'humano';
      await msg.reply(`👤 Conectando com um atendente...\n\nJá vou avisar! Aguarde 🙏`);
      await avisarAtendente(msg, sessao);
      break;

    default:
      await msg.reply(`Não entendi 😅 Digite apenas o *número* da opção:\n\n1️⃣ Preço  2️⃣ Como funciona  3️⃣ Fotos\n4️⃣ Entrega  5️⃣ Comprar  6️⃣ Atendente`);
  }
}

async function avisarAtendente(msg, sessao) {
  const NUMERO_ATENDENTE = '5569999999998@c.us'; // número do vendedor

  const hora = sessao.historico.map(h =>
    h.de === 'cliente' ? `→ Cliente: "${h.texto}"` : `→ Interesse: ${h.interesse}`
  ).join('\n');

  const aviso =
    `🔔 *NOVO LEAD* ${sessao.etapa === 'quente' ? '🔥 QUENTE' : ''}\n\n` +
    `👤 Número: ${msg.from.replace('@c.us', '')}\n` +
    `📦 Produto: ${sessao.produto || 'Não identificado'}\n` +
    `🕐 ${new Date().toLocaleTimeString('pt-BR')}\n\n` +
    `📋 *Histórico:*\n${hora}\n\n` +
    `⚡ Intenção: ${sessao.etapa === 'quente' ? 'COMPRA' : 'DÚVIDA'}`;

  await client.sendMessage(NUMERO_ATENDENTE, aviso);
}

module.exports = { processarMensagem };