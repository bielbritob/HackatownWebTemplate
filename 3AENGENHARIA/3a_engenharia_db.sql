CREATE DATABASE IF NOT EXISTS 3a_engenharia_db;
USE 3a_engenharia_db;

-- 1. Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
                                      id INT PRIMARY KEY AUTO_INCREMENT,
                                      nome VARCHAR(255) NOT NULL,
  preco DECIMAL(10,2),
  descricao TEXT NOT NULL,
  img VARCHAR(255) NOT NULL
  );

-- 2. Tabela de Usuários (Login Admin)
CREATE TABLE IF NOT EXISTS usuarios (
                                      id INT PRIMARY KEY AUTO_INCREMENT,
                                      email VARCHAR(255) NOT NULL,
  senha VARCHAR(255) NOT NULL
  );

-- 3. Inserção de Dados Iniciais
INSERT INTO usuarios (email, senha) VALUES ('admin', 'admin');

INSERT INTO produtos (nome, preco, descricao, img) VALUES
                                                     ('Multímetro Digital Profissional', 39.90, 'Multímetro completo para uso profissional e doméstico', 'https://m.media-amazon.com/images/I/61UenMDyctL._SX522_.jpg'),
                                                     ('Vonder Alicate Universal 8"', 54.99, 'Indicado para segurar peças planas e cilíndricas, cortar e desencapar fios', 'https://m.media-amazon.com/images/I/41xtvIdocnL._AC_SX679_.jpg');

-- 4. Motor do Chat (Atendimentos)
CREATE TABLE IF NOT EXISTS `atendimentos` (
                                            `id` INT NOT NULL AUTO_INCREMENT,
                                            `numero` VARCHAR(64) NOT NULL,
  `nome` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('bot', 'aguardando', 'humano', 'resolvido') NOT NULL DEFAULT 'bot',
  `produto` VARCHAR(255) DEFAULT NULL,
  `temperatura` ENUM('frio', 'quente') NOT NULL DEFAULT 'frio',
  `atualizado_em` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_atendimentos_numero` (`numero`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Controle de Etapas do Bot
CREATE TABLE IF NOT EXISTS `bot_sessoes` (
                                           `id` INT NOT NULL AUTO_INCREMENT,
                                           `numero` VARCHAR(30) NOT NULL,
  `produto` VARCHAR(255) DEFAULT NULL,
  `etapa` VARCHAR(50) DEFAULT 'inicio',
  `historico` JSON DEFAULT NULL,
  `criado_em` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Histórico de Mensagens
CREATE TABLE IF NOT EXISTS `mensagens` (
                                         `id` INT NOT NULL AUTO_INCREMENT,
                                         `numero` VARCHAR(64) NOT NULL,
  `de` ENUM('cliente', 'bot', 'atendente') NOT NULL,
  `texto` TEXT NOT NULL,
  `lida` TINYINT(1) DEFAULT '0',
  `criado_em` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mensagens_numero` (`numero`),
  KEY `idx_mensagens_criado` (`criado_em`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
