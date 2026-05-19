const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',        // usuário do MySQL local
  password: '',        // senha
  database: '3a_engenharia_db', // mesmo banco que o PHP usa
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
