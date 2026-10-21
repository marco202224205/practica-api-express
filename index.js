require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const { pool, probarConexion } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer: guarda temporalmente los archivos recibidos en la carpeta uploads
const upload = multer({ dest: 'uploads/' });

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

// POST /api/recursos/importar -> carga masiva desde un archivo .json o .csv
app.post('/api/recursos/importar', upload.single('archivo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ mensaje: 'Adjunta un archivo en el campo "archivo"' });
  }

  const rutaTemporal = req.file.path;
  const extension = path.extname(req.file.originalname).toLowerCase();

  try {
    let registros = [];

    if (extension === '.json') {
      // JSON: leer con fs y convertir el texto en un arreglo de objetos
      const contenido = fs.readFileSync(rutaTemporal, 'utf8');
      registros = JSON.parse(contenido);

      if (!Array.isArray(registros)) {
        return res.status(400).json({ mensaje: 'El JSON debe contener un arreglo de objetos' });
      }
    } else if (extension === '.csv') {
      // CSV: leer fila por fila con un stream y csv-parser
      registros = await new Promise((resolve, reject) => {
        const filas = [];
        fs.createReadStream(rutaTemporal)
          .pipe(csv())
          .on('data', (fila) => filas.push(fila))
          .on('end', () => resolve(filas))
          .on('error', reject);
      });
    } else {
      return res.status(400).json({ mensaje: 'Formato no soportado. Usa un archivo .json o .csv' });
    }

    // Validar cada registro y preparar los valores para la inserción masiva
    const valores = [];
    let omitidos = 0;

    registros.forEach((registro) => {
      const nombre = registro.nombre ? String(registro.nombre).trim() : '';
      const autor = registro.autor ? String(registro.autor).trim() : '';
      const paginas =
        registro.paginas === undefined || registro.paginas === '' ? 0 : parseInt(registro.paginas);

      if (!nombre || !autor || isNaN(paginas) || paginas < 0) {
        omitidos++;
      } else {
        valores.push([nombre, autor, paginas]);
      }
    });

    if (valores.length === 0) {
      return res.status(400).json({ mensaje: 'El archivo no contiene registros válidos' });
    }

    // Inserción masiva en MySQL
    const [resultado] = await pool.query(
      'INSERT INTO libros (nombre, autor, paginas) VALUES ?',
      [valores]
    );

    res.status(200).json({
      mensaje: 'Importación completada',
      insertados: resultado.affectedRows,
      omitidos
    });
  } catch (error) {
    console.error(error.message);

    if (error instanceof SyntaxError) {
      return res.status(400).json({ mensaje: 'El archivo JSON no tiene un formato válido' });
    }

    res.status(500).json({ mensaje: 'Error interno del servidor' });
  } finally {
    // Eliminar el archivo temporal de uploads
    if (fs.existsSync(rutaTemporal)) {
      fs.unlinkSync(rutaTemporal);
    }
  }
});
// Levantar el servidor y comprobar la conexión a la base de datos
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  probarConexion();
});
// GET /api/recursos/exportar/:formato -> descarga los registros en json o csv
app.get('/api/recursos/exportar/:formato', async (req, res) => {
  try {
    const formato = req.params.formato.toLowerCase();

    if (formato !== 'json' && formato !== 'csv') {
      return res.status(400).json({ mensaje: 'Formato no soportado. Usa json o csv' });
    }

    const [filas] = await pool.query('SELECT * FROM libros');

    if (formato === 'json') {
      // JSON: fuerza la descarga del archivo
      res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.json');
      return res.json(filas);
    }

    // CSV: convierte el arreglo de objetos a texto en formato CSV
    const parser = new Parser({ fields: ['id', 'nombre', 'autor', 'paginas'] });
    const datosCsv = parser.parse(filas);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.csv');
    // El \uFEFF inicial hace que Excel muestre bien los acentos
    res.send('\uFEFF' + datosCsv);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});
// GET /api/recursos/exportar/:formato -> descarga los registros en json o csv
app.get('/api/recursos/exportar/:formato', async (req, res) => {
  try {
    const formato = req.params.formato.toLowerCase();

    if (formato !== 'json' && formato !== 'csv') {
      return res.status(400).json({ mensaje: 'Formato no soportado. Usa json o csv' });
    }

    const [filas] = await pool.query('SELECT * FROM libros');

    if (formato === 'json') {
      // JSON: fuerza la descarga del archivo
      res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.json');
      return res.json(filas);
    }

    // CSV: convierte el arreglo de objetos a texto en formato CSV
    const parser = new Parser({ fields: ['id', 'nombre', 'autor', 'paginas'] });
    const datosCsv = parser.parse(filas);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.csv');
    // El \uFEFF inicial hace que Excel muestre bien los acentos
    res.send('\uFEFF' + datosCsv);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});