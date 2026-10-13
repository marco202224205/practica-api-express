require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, probarConexion } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilita CORS para que el frontend pueda consumir la API
app.use(cors());

// Permite que el servidor entienda solicitudes con cuerpo en formato JSON
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.send('El servidor está en línea');
});

// GET /api/recursos -> devuelve todos los libros
app.get('/api/recursos', async (req, res) => {
  try {
    const [filas] = await pool.query('SELECT * FROM libros');
    res.json(filas);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// GET /api/recursos/:id -> devuelve un libro por ID
app.get('/api/recursos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ mensaje: 'El id debe ser un número' });
    }

    const [filas] = await pool.query('SELECT * FROM libros WHERE id = ?', [id]);

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Recurso no encontrado' });
    }

    res.json(filas[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// POST /api/recursos -> inserta un libro nuevo
app.post('/api/recursos', async (req, res) => {
  try {
    const { nombre, autor, paginas } = req.body || {};

    if (!nombre || !autor) {
      return res.status(400).json({ mensaje: 'Se requieren los campos nombre y autor' });
    }

    const numPaginas = paginas === undefined ? 0 : parseInt(paginas);

    if (isNaN(numPaginas) || numPaginas < 0) {
      return res.status(400).json({ mensaje: 'paginas debe ser un número positivo' });
    }

    const [resultado] = await pool.query(
      'INSERT INTO libros (nombre, autor, paginas) VALUES (?, ?, ?)',
      [nombre, autor, numPaginas]
    );

    res.status(201).json({ id: resultado.insertId, nombre, autor, paginas: numPaginas });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// PUT /api/recursos/:id -> actualiza un libro existente
app.put('/api/recursos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ mensaje: 'El id debe ser un número' });
    }

    const { nombre, autor, paginas } = req.body || {};

    if (!nombre && !autor && paginas === undefined) {
      return res.status(400).json({ mensaje: 'Envía al menos nombre, autor o paginas para actualizar' });
    }

    const numPaginas = paginas === undefined ? null : parseInt(paginas);

    if (numPaginas !== null && (isNaN(numPaginas) || numPaginas < 0)) {
      return res.status(400).json({ mensaje: 'paginas debe ser un número positivo' });
    }

    await pool.query(
      'UPDATE libros SET nombre = COALESCE(?, nombre), autor = COALESCE(?, autor), paginas = COALESCE(?, paginas) WHERE id = ?',
      [nombre || null, autor || null, numPaginas, id]
    );

    const [filas] = await pool.query('SELECT * FROM libros WHERE id = ?', [id]);

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Recurso no encontrado' });
    }

    res.json(filas[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});
// DELETE /api/recursos/:id -> elimina un libro
app.delete('/api/recursos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ mensaje: 'El id debe ser un número' });
    }

    const [resultado] = await pool.query('DELETE FROM libros WHERE id = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Recurso no encontrado' });
    }

    res.json({ mensaje: `Libro con id ${id} eliminado correctamente` });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Levantar el servidor y comprobar la conexión a la base de datos
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  probarConexion();
});