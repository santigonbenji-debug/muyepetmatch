function registrarUsuario() {
  const nombre = document.getElementById('nombre').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const nuevoUsuario = { nombre, email, password };

  fetch('/api/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoUsuario)
  })
    .then(res => {
      if (!res.ok) throw new Error('Falló el registro');
      return res.json();
    })
    .then(() => {
      localStorage.setItem('usuarioLogueado', 'true');
      localStorage.setItem('usuarioNombre', nombre);
      window.location.href = '/inicio';
    })
    .catch(err => {
      console.error(err);
      document.getElementById('mensaje').textContent = 'Error al registrar';
    });
}

document.getElementById('registroForm').addEventListener('submit', function (e) {
  e.preventDefault();
  registrarUsuario();
});
