const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',        // seu usuário do MySQL
  password: 'k2g9ekk6',        // sua senha
  database: 'faroni_db', // mesmo banco que o PHP usa
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;