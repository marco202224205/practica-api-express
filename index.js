const express = require('express');

const app = express();
const PORT = 3000;

// Permite que el servidor entienda solicitudes con cuerpo en formato JSON
app.use(express.json());

// Arreglo en memoria que simula la colección de datos
let libros = [
  { id: 1, nombre: 'Cien años de soledad', autor: 'Gabriel García Márquez' },
  { id: 2, nombre: 'El principito', autor: 'Antoine de Saint-Exupéry' },
  { id: 3, nombre: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes' }
];

// Ruta base
app.get('/', (req, res) => {
  res.send('El servidor está en línea');
});

// GET /api/recursos -> devuelve todos los libros
app.get('/api/recursos', (req, res) => {
  res.json(libros);
});

// GET /api/recursos/:id -> devuelve un libro por ID
app.get('/api/recursos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const libro = libros.find((l) => l.id === id);

  if (!libro) {
    return res.status(404).json({ mensaje: 'Recurso no encontrado' });
  }

  res.json(libro);
});

// POST /api/recursos -> crea un libro nuevo con ID dinámico
app.post('/api/recursos', (req, res) => {
  const { nombre, autor } = req.body || {};

  if (!nombre || !autor) {
    return res.status(400).json({ mensaje: 'Se requieren los campos nombre y autor' });
  }

  const nuevoId = libros.length > 0 ? Math.max(...libros.map((l) => l.id)) + 1 : 1;
  const nuevoLibro = { id: nuevoId, nombre, autor };

  libros.push(nuevoLibro);
  res.status(201).json(nuevoLibro);
});

// PUT /api/recursos/:id -> actualiza un libro existente
app.put('/api/recursos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const libro = libros.find((l) => l.id === id);

  if (!libro) {
    return res.status(404).json({ mensaje: 'Recurso no encontrado' });
  }

  const { nombre, autor } = req.body || {};

  if (nombre !== undefined) libro.nombre = nombre;
  if (autor !== undefined) libro.autor = autor;

  res.json(libro);
});

// DELETE /api/recursos/:id -> elimina un libro
app.delete('/api/recursos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const indice = libros.findIndex((l) => l.id === id);

  if (indice === -1) {
    return res.status(404).json({ mensaje: 'Recurso no encontrado' });
  }

  libros.splice(indice, 1);
  res.json({ mensaje: `Libro con id ${id} eliminado correctamente` });
});

// Levantar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});