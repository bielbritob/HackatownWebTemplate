const pool = require('./db');

const CHAT_SUFFIX = '@c.us';

function normalizeChatId(numero) {
  if (!numero) return '';
  const s = String(numero).trim();
  if (s.endsWith('@c.us') || s.endsWith('@g.us')) return s;
  return `${s.replace(/\D/g, '')}${CHAT_SUFFIX}`;
}

async function getAtendimentoStatus(numero) {
  const id = normalizeChatId(numero);
  const [rows] = await pool.execute(
    'SELECT status, produto, temperatura FROM atendimentos WHERE numero = ? LIMIT 1',
    [id]
  );
  return rows[0] || { status: 'bot', produto: null, temperatura: 'frio' };
}

async function ensureAtendimentoRow(numero, produto = null) {
  const id = normalizeChatId(numero);
  await pool.execute(
    `INSERT INTO atendimentos (numero, status, produto, temperatura)
     VALUES (?, 'bot', ?, 'frio')
     ON DUPLICATE KEY UPDATE
       atualizado_em = CURRENT_TIMESTAMP,
       produto = IF(VALUES(produto) IS NOT NULL AND VALUES(produto) != '', VALUES(produto), atendimentos.produto)`,
    [id, produto]
  );
}

async function salvarMensagem(numero, de, texto) {
  const id = normalizeChatId(numero);
  await ensureAtendimentoRow(id);
  await pool.execute(
    'INSERT INTO mensagens (numero, de, texto) VALUES (?, ?, ?)',
    [id, de, texto]
  );
  await pool.execute(
    'UPDATE atendimentos SET atualizado_em = CURRENT_TIMESTAMP WHERE numero = ?',
    [id]
  );
}

async function persistBotSessao(numero, produto, etapa, historico) {
  const id = normalizeChatId(numero);
  await pool.execute(
    `INSERT INTO bot_sessoes (numero, produto, etapa, historico, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       produto = VALUES(produto),
       etapa = VALUES(etapa),
       historico = VALUES(historico),
       atualizado_em = NOW()`,
    [id, produto, etapa, JSON.stringify(historico)]
  );
}

async function loadBotSessaoRow(numero) {
  const id = normalizeChatId(numero);
  const [rows] = await pool.execute(
    'SELECT produto, etapa, historico FROM bot_sessoes WHERE numero = ? LIMIT 1',
    [id]
  );
  if (!rows[0]) return null;
  let historico = [];
  try {
    historico = typeof rows[0].historico === 'string' ? JSON.parse(rows[0].historico || '[]') : rows[0].historico || [];
  } catch {
    historico = [];
  }
  return {
    produto: rows[0].produto,
    etapa: rows[0].etapa,
    historico: Array.isArray(historico) ? historico : []
  };
}

async function atualizarAtendimento(numero, fields) {
  const id = normalizeChatId(numero);
  const parts = [];
  const vals = [];
  if (fields.status != null) {
    parts.push('status = ?');
    vals.push(fields.status);
  }
  if (fields.produto != null) {
    parts.push('produto = ?');
    vals.push(fields.produto);
  }
  if (fields.temperatura != null) {
    parts.push('temperatura = ?');
    vals.push(fields.temperatura);
  }
  if (!parts.length) return;
  vals.push(id);
  await pool.execute(
    `UPDATE atendimentos SET ${parts.join(', ')}, atualizado_em = CURRENT_TIMESTAMP WHERE numero = ?`,
    vals
  );
}

async function listarConversas() {
  const [rows] = await pool.query(`
    SELECT
      a.numero,
      a.status,
      a.produto,
      a.temperatura,
      a.atualizado_em,
      (SELECT texto FROM mensagens m WHERE m.numero = a.numero ORDER BY m.criado_em DESC LIMIT 1) AS ultima_mensagem,
      (SELECT criado_em FROM mensagens m WHERE m.numero = a.numero ORDER BY m.criado_em DESC LIMIT 1) AS ultima_mensagem_em,
      (SELECT COUNT(*) FROM mensagens m WHERE m.numero = a.numero AND m.de = 'cliente' AND m.lida = 0) AS nao_lidas
    FROM atendimentos a
    ORDER BY
      FIELD(a.status, 'humano', 'aguardando', 'bot', 'resolvido'),
      a.atualizado_em DESC
    LIMIT 200
  `);
  return rows;
}

async function listarMensagens(numero) {
  const id = normalizeChatId(numero);
  const [rows] = await pool.execute(
    'SELECT id, numero, de, texto, lida, criado_em FROM mensagens WHERE numero = ? ORDER BY criado_em ASC',
    [id]
  );
  return rows;
}

async function marcarMensagensClienteLidas(numero) {
  const id = normalizeChatId(numero);
  await pool.execute(
    "UPDATE mensagens SET lida = 1 WHERE numero = ? AND de = 'cliente'",
    [id]
  );
}

async function resetBotEtapaMenu(numero) {
  const id = normalizeChatId(numero);
  await pool.execute(
    "UPDATE bot_sessoes SET etapa = 'menu', atualizado_em = CURRENT_TIMESTAMP WHERE numero = ?",
    [id]
  );
}

module.exports = {
  normalizeChatId,
  getAtendimentoStatus,
  ensureAtendimentoRow,
  salvarMensagem,
  persistBotSessao,
  loadBotSessaoRow,
  atualizarAtendimento,
  listarConversas,
  listarMensagens,
  marcarMensagensClienteLidas,
  resetBotEtapaMenu
};
