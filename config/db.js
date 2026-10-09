require('dotenv').config();
const mysql = require('mysql2/promise');

// Pool de conexiones con las credenciales del archivo .env
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Verifica la conexión al levantar el servidor
async function probarConexion() {
  try {
    const conexion = await pool.getConnection();
    console.log('Conectado exitosamente a la base de datos');
    conexion.release();
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
  }
}

module.exports = { pool, probarConexion };