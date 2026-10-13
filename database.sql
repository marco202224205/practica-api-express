CREATE DATABASE IF NOT EXISTS api_practica
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE api_practica;

CREATE TABLE IF NOT EXISTS libros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  autor VARCHAR(100) NOT NULL,
  paginas INT NOT NULL DEFAULT 0
);

INSERT INTO libros (nombre, autor, paginas) VALUES
  ('Cien años de soledad', 'Gabriel García Márquez', 471),
  ('El principito', 'Antoine de Saint-Exupéry', 96),
  ('Don Quijote de la Mancha', 'Miguel de Cervantes', 863),
  ('Pedro Páramo', 'Juan Rulfo', 128);