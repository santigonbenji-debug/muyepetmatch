const fotoInput = document.getElementById("foto");
const preview = document.getElementById("preview");

fotoInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = "";
  }
});

document.getElementById("formMascota").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("nombre", document.getElementById("nombre").value);
  formData.append("edad", document.getElementById("edad").value);
  formData.append("tipo", document.getElementById("tipo").value);
  formData.append("descripcion", document.getElementById("descripcion").value);
  formData.append("ubicacion", document.getElementById("ubicacion").value);
  formData.append("foto", document.getElementById("foto").files[0]);

  fetch(
    "https://1ad8dc2f-59a8-4450-9313-6fde6981bcb3-00-3q7g2mlzk8gvy.picard.replit.dev/publicar-mascota",
    {
      method: "POST",
      body: formData,
    },
  )
    .then((response) => response.json())
    .then((data) => {
      alert(data.mensaje);
      window.location.href = "inicio.html";
    })
    .catch((error) => {
      console.error("Error al publicar mascota:", error);
      alert("Ocurrió un error al publicar la mascota");
    });
});
z