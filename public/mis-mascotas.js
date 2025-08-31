// public/mis-mascotas.js — fix perfil + fallback + sin /usuarios.json
(() => {
  const $ = (s) => document.querySelector(s);
  let MIS = [];

  // Estilos puntuales
  (function injectStyles(){
    if (document.getElementById("mis-mascotas-actions-style")) return;
    const st = document.createElement("style");
    st.id = "mis-mascotas-actions-style";
    st.textContent = `
      #avatarPreview{display:block;width:130px;height:130px;border-radius:999px;border:4px solid #ffb996;object-fit:cover;background:#fff7f0}
      .card-mascota .actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px;padding-top:8px;border-top:1px dashed #eadfd2}
      .card-mascota .actions button{border:1px solid #e2d4c6;background:#fff;border-radius:10px;padding:8px 12px;cursor:pointer;font-weight:600}
      .card-mascota .actions button:hover{background:#fdf3ea}
      .badge-adoptada{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:#e8f7e8;color:#2e7d32;font-size:12px;border:1px solid #cfe9cf;vertical-align:middle}
    `;
    document.head.appendChild(st);
  })();

  /* ---------- Cargar mis publicaciones ---------- */
  async function cargar() {
    const email = localStorage.getItem("usuarioEmail");
    if (!email) { window.location.href = "registro.html"; return; }

    const res = await fetch("/api/mascotas");
    const todas = await res.json();
    MIS = (todas || []).filter((m) => m.usuarioEmail === email);
    renderCards();
    cargarPerfilUsuario(); // columna izquierda
  }
  function cardHTML(m) {
    return `
      <div class="card-mascota">
        <img src="${m.foto || "Mlogo.png"}" alt="${m.tipo || ""}">
        <h3>${m.nombre || "(Sin nombre)"}</h3>
        <p>Edad: ${m.edad || "—"}</p>
        <p>Tipo: ${m.tipo || "—"}</p>
        <p>${m.descripcion || ""}</p>
        <div class="actions">
          <button data-act="estado" data-id="${m.id}">
            ${m.estado === "adoptada" ? "Marcar disponible" : "Marcar adoptada"}
          </button>
          <button data-act="editar" data-id="${m.id}">Editar</button>
          <button data-act="eliminar" data-id="${m.id}">Eliminar</button>
        </div>
      </div>
    `;
  }

  function renderCards() {
    const wrap = $("#cardsMascotas");
    if (!wrap) return;
    if (!MIS.length) {
      wrap.innerHTML = "<p style='margin-top:25px;color:#b18a7b;'>No publicaste mascotas todavía.</p>";
      return;
    }
    wrap.innerHTML = MIS.map(cardHTML).join("");
  }

  // Delegación de clicks de las tarjetas
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".card-mascota .actions button");
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    const m = MIS.find((x) => String(x.id) === String(id));
    if (!m) return;

    try {
      if (act === "estado") {
        const nuevo = m.estado === "adoptada" ? "disponible" : "adoptada";
        const r = await fetch(`/api/mascotas/${id}/estado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: nuevo }),
        });
        if (!r.ok) { alert("No se pudo cambiar el estado."); return; }
        await cargar();
      }
      if (act === "editar") { abrirModalEditar(m); return; }
      if (act === "eliminar") {
        if (!confirm("¿Eliminar esta publicación?")) return;
        await fetch(`/api/mascotas/${id}`, { method: "DELETE" });
        await cargar();
      }
    } catch {
      alert("Ups, no se pudo completar la acción.");
    }
  });

  // Modal editar mascota
  function abrirModalEditar(m) {
    const modal = $("#modal-editar");
    const form = $("#form-editar");
    if (!modal || !form) return;
    $("#editId").value = m.id;
    $("#editNombre").value = m.nombre || "";
    $("#editEdad").value = m.edad ?? "";
    $("#editTipo").value = m.tipo || "Perro";
    $("#editUbicacion").value = m.ubicacion || "";
    $("#editDescripcion").value = m.descripcion || "";
    modal.hidden = false;
    setTimeout(() => $("#editNombre").focus(), 0);
  }
  function cerrarModalEditar(){
    const modal = $("#modal-editar"); if(modal) modal.hidden = true;
    $("#form-editar")?.reset();
  }
  document.addEventListener("click",(e)=>{ if(e.target.id==="cerrarModalEditar"||e.target.id==="cancelarEditar") cerrarModalEditar(); if(e.target.id==="modal-editar") cerrarModalEditar(); });
  document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") cerrarModalEditar(); });

  document.addEventListener("submit", async (e) => {
    if (e.target && e.target.id === "form-editar") {
      e.preventDefault();
      const id = $("#editId").value;
      const body = {
        nombre: $("#editNombre").value.trim(),
        edad: Number($("#editEdad").value),
        tipo: $("#editTipo").value,
        ubicacion: $("#editUbicacion").value.trim(),
        descripcion: $("#editDescripcion").value.trim(),
      };
      const resp = await fetch(`/api/mascotas/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!resp.ok) { alert("No se pudieron guardar los cambios."); return; }
      cerrarModalEditar(); cargar();
    }
  });

  /* ---------- PERFIL (columna izquierda) ---------- */
  async function cargarPerfilUsuario() {
    const usuarioEmail = localStorage.getItem("usuarioEmail");
    if (!usuarioEmail) return;

    const fallback = "loguito.png";

    try {
      const r = await fetch(`/api/usuario?email=${encodeURIComponent(usuarioEmail)}`);
      const { ok, usuario:u } = await r.json();
      if (!ok) return;

      // Llenar campos visibles
      $("#perfilNombre")     && ($("#perfilNombre").textContent     = u.nombre || "Nombre Apellido");
      $("#perfilUbicacion")  && ($("#perfilUbicacion").textContent  = u.ubicacion || "Ubicación");
      $("#perfilEmail")      && ($("#perfilEmail").textContent      = u.email || usuarioEmail);
      $("#perfilTelefono")   && ($("#perfilTelefono").textContent   = u.telefono ? `Tel: ${u.telefono}` : "Tel: —");
      $("#perfilContacto")   && ($("#perfilContacto").textContent   = u.alias ? `@${u.alias}` : "");
      $("#perfilSobreMi")    && ($("#perfilSobreMi").textContent    = u.sobreMi || u.sobremi || "¡Amante de los animales! 🐶🐱");

      const avatar = $("#avatarMain");
      if (avatar) {
        avatar.src = u.fotoPerfil || fallback;
        avatar.onerror = function(){ this.onerror=null; this.src=fallback; };
      }
    } catch (e) {
      console.warn("perfil no disponible", e);
    }
  }

  // Abrir / cerrar modal de PERFIL (editar)
  $("#btnEditarPerfil")?.addEventListener("click",(e)=>{ e.preventDefault(); abrirModalPerfil(); });

  function abrirModalPerfil(){
    const usuarioEmail = localStorage.getItem("usuarioEmail") || "";
    fetch(`/api/usuario?email=${encodeURIComponent(usuarioEmail)}`)
      .then(r=>r.json())
      .then(({ok, usuario:u})=>{
        if(!ok) return;
        $("#inputNombre").value    = u.nombre    || "";
        "#inputUbicacion" in window && ($("#inputUbicacion").value = u.ubicacion || "");
        $("#inputEmail").value     = u.email     || usuarioEmail;
        $("#inputTelefono").value  = u.telefono  || "";
        $("#inputWhatsapp").value  = u.whatsapp  || "";
        $("#inputAlias").value     = u.alias     || "";
        $("#inputSobreMi").value   = u.sobreMi   || "";
        $("#avatarPreview").src    = u.fotoPerfil || "perfil-default.png";
        $("#modal-editar-perfil").hidden = false;
      });
  }
  function cerrarModalPerfil(){ $("#modal-editar-perfil").hidden = true; }
  document.addEventListener("click",(e)=>{ if(e.target.id==="cerrarModalPerfil"||e.target.id==="cancelarEditarPerfil") cerrarModalPerfil(); if(e.target.id==="modal-editar-perfil") cerrarModalPerfil(); });
  document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") cerrarModalPerfil(); });

  // Preview avatar inmediato
  const fileInput = $("#fotoPerfilFile");
  const avatarPreview = $("#avatarPreview");
  fileInput?.addEventListener("change", ()=> {
    const f = fileInput.files?.[0];
    if (f) { avatarPreview.src = URL.createObjectURL(f); }
  });

  // Subir foto si hay
  async function subirFotoPerfilSiHay(email){
    const f = fileInput?.files?.[0];
    if (!f) return null;
    const fd = new FormData();
    fd.append("fotoPerfil", f);
    fd.append("email", (email||"").trim().toLowerCase());
    const resp = await fetch("/api/usuario/foto", { method:"POST", body: fd });
    const j = await resp.json().catch(()=>({}));
    if (!resp.ok || !j.ok) throw new Error(j.error || "No se pudo subir la foto");
    return j.fotoPerfil;
  }

  // Guardar perfil
  document.addEventListener("submit", async (e) => {
    if (e.target && e.target.id === "formPerfil") {
      e.preventDefault();
      const email = ($("#inputEmail").value || "").trim().toLowerCase();
      const datos = {
        email,
        nombre: $("#inputNombre").value,
        ubicacion: $("#inputUbicacion").value,
        telefono: $("#inputTelefono").value,
        whatsapp: $("#inputWhatsapp").value,
        alias: $("#inputAlias").value,
        sobremi: $("#inputSobreMi").value
      };
      const btn = $("#formPerfil button[type='submit']");
      if (btn) btn.disabled = true;

      try {
        const ruta = await subirFotoPerfilSiHay(email);
        if (ruta) datos.fotoPerfil = ruta;

        const r2 = await fetch("/api/actualizar-usuario", {
          method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(datos)
        });
        const j2 = await r2.json().catch(()=>({}));
        if (!r2.ok || !j2.ok) throw new Error(j2.error || "No se pudo guardar");

        cerrarModalPerfil();
        if (ruta) { const main = $("#avatarMain"); if (main) main.src = ruta; }
        await cargarPerfilUsuario();
        alert("Perfil actualizado");
      } catch (err) {
        console.error(err);
        alert("No pudimos actualizar tu perfil. Intentá de nuevo.");
      } finally {
        if (btn) btn.disabled = false;
      }
    }
  });

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", cargar);
})();
