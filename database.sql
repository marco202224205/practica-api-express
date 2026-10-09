CREATE DATABASE IF NOT EXISTS api_practica
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE api_practica;

CREATE TABLE IF NOT EXISTS libros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  autor VARCHAR(100) NOT NULL
);

INSERT INTO libros (nombre, autor) VALUES
  ('Cien años de soledad', 'Gabriel García Márquez'),
  ('El principito', 'Antoine de Saint-Exupéry'),
  ('Don Quijote de la Mancha', 'Miguel de Cervantes');