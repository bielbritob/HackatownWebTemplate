




-- Execute no MySQL (Beekeeper) antes de rodar o bot com o painel.
-- Ajuste o database se necessário: USE faroni_db;

CREATE TABLE IF NOT EXISTS mensagens (
   id          INT AUTO_INCREMENT PRIMARY KEY,
   numero      VARCHAR(64) NOT NULL,
   de          ENUM('cliente', 'bot', 'atendente') NOT NULL,
   texto       TEXT NOT NULL,
   lida        BOOLEAN DEFAULT FALSE,
   criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
   INDEX idx_mensagens_numero (numero),
   INDEX idx_mensagens_criado (criado_em)
);

CREATE TABLE IF NOT EXISTS atendimentos (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    numero        VARCHAR(64) NOT NULL,
    status        ENUM('bot', 'aguardando', 'humano', 'resolvido') NOT NULL DEFAULT 'bot',
    produto       VARCHAR(255) NULL,
    temperatura   ENUM('frio', 'quente') NOT NULL DEFAULT 'frio',
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_atendimentos_numero (numero)
);



CREATE TABLE IF NOT EXISTS bot_sessoes (
    numero VARCHAR(50) PRIMARY KEY,
    produto VARCHAR(100),
    etapa VARCHAR(50) DEFAULT 'menu',
    historico JSON,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
