document.getElementById("formMascota").addEventListener("submit", function (e) {
  e.preventDefault();
  // Validaciones rápidas de front
  const nombre = document.getElementById("nombre").value.trim();
  const edad = document.getElementById("edad").value;
  const tipo = document.getElementById("tipo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const ubicacion = document.getElementById("ubicacion").value.trim();
  const archivo = document.getElementById("foto").files[0];

  if (!nombre || !edad || !tipo || !descripcion || !ubicacion || !archivo) {
    document.getElementById("mensaje").textContent = "Completá todos los campos.";
    return;
  }
  const okTipo = ["image/jpeg","image/png","image/webp"].includes(archivo.type);
  if (!okTipo) { document.getElementById("mensaje").textContent = "Formato de imagen no permitido (JPG/PNG/WEBP)."; return; }
  if (archivo.size > 3 * 1024 * 1024) { document.getElementById("mensaje").textContent = "La imagen no puede superar 3 MB."; return; }


  const formData = new FormData();
  formData.append("nombre", document.getElementById("nombre").value);
  formData.append("edad", document.getElementById("edad").value);
  formData.append("tipo", document.getElementById("tipo").value);
  formData.append("descripcion", document.getElementById("descripcion").value);
  formData.append("ubicacion", document.getElementById("ubicacion").value);
  formData.append("foto", document.getElementById("foto").files[0]);
  // 👇 reemplazá tu línea por este bloque
  const usuarioEmail =
    (window.getUsuarioEmail && window.getUsuarioEmail()) ||
    localStorage.getItem("usuarioEmail") || "";   // fallback por si acaso

  if (!usuarioEmail) {                            // guard por si se perdió la sesión
    alert("Tu sesión expiró. Iniciá sesión de nuevo.");
    window.location.href = "login.html";
    return;
  }

  formData.append("usuarioEmail", usuarioEmail);  // 👈 IMPORTANTE: mandarlo al backend


  fetch("/api/publicar", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("mensaje").textContent =
          "¡Mascota publicada correctamente!";
        // Opcional: Redirigí al inicio después de 1 segundo
        setTimeout(() => (window.location.href = "inicio.html"), 1000);
      } else {
        document.getElementById("mensaje").textContent =
          "Error al publicar la mascota";
      }
    })
    .catch((error) => {
      document.getElementById("mensaje").textContent =
        "Error al conectar con el servidor";
      console.error(error);
    });
});
