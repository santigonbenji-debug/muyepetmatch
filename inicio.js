// Simulamos si hay sesión
const usuarioLogueado = localStorage.getItem('usuarioLogueado');

// Función para validar antes de publicar
function manejarPublicar() {
  if (usuarioLogueado) {
    window.location.href = 'publicar.html';
  } else {
    window.location.href = 'registro.html';
  }
}

// Función para validar antes de adoptar
function manejarAdoptar() {
  if (usuarioLogueado) {
    alert("Funcionalidad de adopción próximamente 😄");
  } else {
    window.location.href = 'registro.html';
  }
}
