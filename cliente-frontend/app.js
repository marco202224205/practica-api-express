const API_URL = 'http://localhost:3000/api/recursos';

// Pide los libros a la API y los muestra en la tabla y en la gráfica
async function cargarLibros() {
  const contenedor = document.getElementById('tabla-datos');

  try {
    const respuesta = await fetch(API_URL);

    if (!respuesta.ok) {
      throw new Error(`La API respondió con el estado ${respuesta.status}`);
    }

    const libros = await respuesta.json();
    console.log('Datos recibidos de la API:', libros);

    mostrarTabla(libros, contenedor);
    mostrarGrafica(libros);
  } catch (error) {
    contenedor.textContent =
      'No se pudieron cargar los datos. Verifica que el servidor Node y MySQL estén corriendo.';
    console.error(error);
  }
}

// Genera dinámicamente la tabla HTML a partir del arreglo de libros
function mostrarTabla(libros, contenedor) {
  contenedor.innerHTML = '';

  if (libros.length === 0) {
    contenedor.textContent = 'No hay registros en la base de datos.';
    return;
  }

  const tabla = document.createElement('table');

  // Encabezado
  const encabezado = tabla.createTHead().insertRow();
  ['ID', 'Nombre', 'Autor', 'Páginas'].forEach((titulo) => {
    const th = document.createElement('th');
    th.textContent = titulo;
    encabezado.appendChild(th);
  });

  // Filas de datos
  const cuerpo = tabla.createTBody();
  libros.forEach((libro) => {
    const fila = cuerpo.insertRow();
    [libro.id, libro.nombre, libro.autor, libro.paginas].forEach((valor) => {
      fila.insertCell().textContent = valor;
    });
  });

  contenedor.appendChild(tabla);
}

// Dibuja una gráfica de barras con Chart.js usando los datos de la API
function mostrarGrafica(libros) {
  // Arreglos separados: etiquetas (nombres) y valores (páginas)
  const nombres = libros.map((libro) => libro.nombre);
  const paginas = libros.map((libro) => libro.paginas);

  const lienzo = document.getElementById('miGrafica');

  new Chart(lienzo, {
    type: 'bar',
    data: {
      labels: nombres,
      datasets: [
        {
          label: 'Número de páginas',
          data: paginas,
          backgroundColor: [
            'rgba(52, 152, 219, 0.7)',
            'rgba(46, 204, 113, 0.7)',
            'rgba(231, 76, 60, 0.7)',
            'rgba(155, 89, 182, 0.7)',
            'rgba(241, 196, 15, 0.7)',
            'rgba(230, 126, 34, 0.7)'
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Páginas' }
        }
      }
    }
  });
}

cargarLibros();