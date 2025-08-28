// sesion.js
(() => {
  const DURACION_HORAS = 12;

  function setSesion(email, horas = DURACION_HORAS) {
    const expira = Date.now() + horas * 60 * 60 * 1000;
    localStorage.setItem("usuarioEmail", email);
    localStorage.setItem("sesionExpira", String(expira));
  }

  function limpiarSesion() {
    localStorage.removeItem("usuarioEmail");
    localStorage.removeItem("sesionExpira");
  }

  function getUsuarioEmail() {
    return localStorage.getItem("usuarioEmail") || null;
  }

  function sesionVigente() {
    const email = getUsuarioEmail();
    const exp = Number(localStorage.getItem("sesionExpira") || 0);
    if (!email || !exp) return false;
    if (Date.now() > exp) {
      limpiarSesion();
      return false;
    }
    return true;
  }

  function exigirSesion() {
    if (!sesionVigente()) {
      alert("Tu sesión expiró o no has iniciado sesión.");
      window.location.href = "registro.html"; // ← con .html
    }
  }

  // Renovar “deslizante” con interacción
  function renovarSesion(horas = DURACION_HORAS) {
    if (!sesionVigente()) return;
    const nuevoExp = Date.now() + horas * 60 * 60 * 1000;
    localStorage.setItem("sesionExpira", String(nuevoExp));
  }

  function cerrarSesion() {
    limpiarSesion();
    window.location.href = "inicio.html"; // ← con .html
  }

  // Exponer
  window.setSesion = setSesion;
  window.cerrarSesion = cerrarSesion;
  window.sesionVigente = sesionVigente;
  window.exigirSesion = exigirSesion;
  window.getUsuarioEmail = getUsuarioEmail;
  window.renovarSesion = renovarSesion;

  // Si la página requiere login, lo chequeamos al cargar:
  document.addEventListener("DOMContentLoaded", () => {
    if (window.REQUIERE_LOGIN === true) {
      exigirSesion();
    }
    // Renovación por actividad (simple y efectiva)
    ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach((evt) => {
      window.addEventListener(evt, () => renovarSesion());
    });
  });
})();
// === WhatsApp normalizador (AR) ===
// Uso: const url = buildWaLink('2657-392998'); -> https://wa.me/5492657392998
window.buildWaLink = function buildWaLink(num, country='54') {
  if (!num) return null;
  let d = String(num).replace(/\D/g, '');   // solo dígitos

  // Quita 0 inicial de larga distancia
  if (d.startsWith('0')) d = d.slice(1);

  // Quita "15" después del código de área (ej: 2657 15 392998 -> 2657 392998)
  d = d.replace(/^(\d{2,4})15/, '$1');

  // Si no empieza con el país, anteponer 54 + 9 (formato móvil Argentina)
  if (!d.startsWith(country)) d = '549' + d;

  return `https://wa.me/${d}`;
};
