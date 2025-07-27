document.getElementById('registroForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const datos = {
    nombre: document.getElementById('nombre').value,
    apellido: document.getElementById('apellido').value,
    email: document.getElementById('email').value,
    fechaNacimiento: document.getElementById('fecha').value,
    descripcion: document.getElementById('descripcion').value,
    password: document.getElementById('password').value
  };

  try {
    const respuesta = await fetch('/registrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (respuesta.ok) {
      alert('Cuenta creada con éxito.');
      // Podés redirigir si querés: window.location.href = 'iniciointerno.html';
    } else {
      alert('Error: ' + resultado.mensaje);
    }
  } catch (error) {
    alert('Error en la conexión con el servidor');
  }
});
