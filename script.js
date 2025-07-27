function mostrarSeccion(seccion) {
  const contenido = document.getElementById("contenido");
  contenido.style.opacity = 0;

  setTimeout(() => {
    if (seccion === 'inicio') {
      contenido.innerHTML = `
        <div class="inicio-bienvenida">
          <h2>Bienvenido a Muyè PetMatch</h2>
          <p>Un puente entre almas.</p>
          <p>Adoptá, conectá, ayudá. Todo empieza con un gesto de amor.</p>
          <button class="boton-comenzar" onclick="mostrarSeccion('quienes')">COMENZAR</button>
        </div>
      `;
    } else if (seccion === 'quienes') {
      contenido.innerHTML = `
        <h2>¿Quiénes somos?</h2>
        <p>Somos un puente entre almas. Muyè nace del amor por los animales y el deseo de conectar corazones con seres que solo saben amar. Esta plataforma no es una simple página de adopciones, es un lugar donde comienza algo más grande: una comunidad con propósito.</p>
        <p>Creemos en la mirada sincera, en los actos que cambian vidas y en el poder de un compañero peludo. Muyè es ese espacio donde el vínculo con ellos empieza desde el respeto, la responsabilidad y el afecto.</p>
      `;
    } else if (seccion === 'adoptar') {
      contenido.innerHTML = `
        <h2>¿Qué necesitás saber para adoptar?</h2>
        <p>Adoptar es un compromiso de amor. Asegurate de tener el tiempo, el espacio y la disposición emocional para compartir tu vida con un nuevo compañero.</p>
        <p>Pronto vas a poder ver a todos los peluditos que buscan hogar, con su historia, gustos y lo que necesitan. Cada adopción responsable cambia dos vidas: la del animal... y la tuya.</p>
      `;
    } else if (seccion === 'info') {
      contenido.innerHTML = `
        <h2>Información útil</h2>
        <p>Muyè es más que una página: es un espacio que creamos con conciencia, responsabilidad y amor. Queremos que sea fácil ayudar, compartir, adoptar y también encontrar. Por eso vamos a ir sumando herramientas, redes y recursos que lo hagan posible.</p>
        <p>Nos vamos a manejar con criterio, buscando siempre lo mejor para todos los seres que forman parte de este proyecto. Y aunque estamos empezando, no hay límites cuando se trata de los animales y las formas de amar incondicionalmente.</p>
        <p style="font-size: 14px; color: #888; margin-top: 20px;"><strong>Marco legal:</strong> Muyè no es responsable por los acuerdos entre usuarios. Promovemos la tenencia responsable y el respeto animal. Ante dudas legales, recomendamos consultar a un profesional.</p>
      `;
    }

    contenido.style.opacity = 1;
  }, 200);
}
function abrirRegistro() {
  document.getElementById("modalRegistro").style.display = "flex";
}

function cerrarRegistro() {
  document.getElementById("modalRegistro").style.display = "none";
}

function enviarRegistro() {
  const nombre = document.getElementById("nombreRegistro").value;
  const email = document.getElementById("emailRegistro").value;
  const password = document.getElementById("passwordRegistro").value;

  if (!nombre || !email || !password) {
    alert("Por favor completá todos los campos.");
    return;
  }

  alert("Registro simulado. Guardaremos esto en breve.");
  cerrarRegistro();
}
document.querySelector('.boton-comenzar').addEventListener('click', () => {
  document.getElementById('contenido').style.display = 'none';
  document.getElementById('pantalla-principal').style.display = 'flex';
});
document.addEventListener('DOMContentLoaded', () => {
  const botonComenzar = document.querySelector('.boton-comenzar');
  const pantallaInicio = document.getElementById('contenido');
  const pantallaPrincipal = document.getElementById('pantalla-principal');

  if (botonComenzar && pantallaInicio && pantallaPrincipal) {
    botonComenzar.addEventListener('click', () => {
      pantallaInicio.style.display = 'none';
      pantallaPrincipal.style.display = 'flex';
    });
  }
});


