document.getElementById("formLogin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = (document.getElementById("loginEmail").value || "").trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const err = document.getElementById("loginError");
  err.textContent = "";

  try {
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) {
      err.textContent = j.error === "CREDENCIALES_INVALIDAS" ? "Email o contraseña incorrectos" : "No se pudo iniciar sesión";
      return;
    }
    window.setSesion(j.usuario.email); // usa sesion.js
    localStorage.setItem("usuarioNombre", j.usuario.nombre || "");
    localStorage.setItem("usuarioEmail", j.usuario.email);
    window.location.href = "inicio.html";
  } catch {
    err.textContent = "No se pudo conectar al servidor";
  }
});
