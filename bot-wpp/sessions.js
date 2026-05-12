const db = require('./db');

// Salvar/atualizar sessão
await db.execute(
  `INSERT INTO bot_sessoes (numero, produto, etapa, historico, atualizado_em)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       produto = VALUES(produto),
       etapa = VALUES(etapa),
       historico = VALUES(historico),
       atualizado_em = NOW()`,
  [numero, sessao.produto, sessao.etapa, JSON.stringify(sessao.historico)]
);

// Recuperar sessão
const [rows] = await db.execute(
  'SELECT * FROM bot_sessoes WHERE numero = ?',
  [numero]
);