function cargarSeccion(nombreArchivo) {
  fetch(nombreArchivo)
    .then(respuesta => respuesta.text())
    .then(html => {
      document.getElementById('contenido-principal').innerHTML = html;
    })
    .catch(error => {
      document.getElementById('contenido-principal').innerHTML = "<p>Error al cargar el contenido.</p>";
    });
}
function activarModoOscuro() {
  document.body.classList.toggle("modo-oscuro");
}
