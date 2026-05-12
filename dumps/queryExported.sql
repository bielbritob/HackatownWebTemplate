CREATE DATABASE IF NOT EXISTS faroni_db;

USE faroni_db;

CREATE table IF NOT EXISTS produtos (
  id INT PRIMARY KEY auto_increment,
  nome VARCHAR(255) NOT NULL,
  preco DECIMAL(10,2),
  descricao text NOT NULL,
  img varchar(255) NOT NULL
);

CREATE table IF NOT EXISTS usuarios (
  id INT PRIMARY KEY auto_increment,
  email varchar(255) NOT NULL,
  senha varchar(255) NOT NULL
  
);

CREATE TABLE bot_sessoes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    numero      VARCHAR(30) UNIQUE NOT NULL,  -- ex: 5569999999999
    produto     VARCHAR(255),
    etapa       VARCHAR(50) DEFAULT 'inicio',
    historico   JSON,
    criado_em   DATETIME DEFAULT NOW(),
    atualizado_em DATETIME DEFAULT NOW()
);


INSERT INTO usuarios (email, senha) values (
  'admin',
  'admin'
);

INSERT INTO produtos (nome, preco, descricao, img)
VALUES 
(
  'Caderno Tilibra',
  35.90,
  'Capa dura 10 matérias',
  'https://m.media-amazon.com/images/I/41lBrKARimL._AC_SX522_.jpg'
),
(
  'Lapiseira Pilot',
  12.99, 
  'Ponta 0.7mm',
  'https://m.media-amazon.com/images/I/51PTTBp9d4L._AC_SX522_.jpg'
);