// ===== MUYÈ PETMATCH — INICIO =====

// Navegación básica
function manejarPublicar() {
  if (window.sesionVigente && window.sesionVigente()) {
    window.location.href = "publicar.html";
  } else {
    window.location.href = "registro.html";
  }
}

let TODAS = [];
let FILTRADAS = [];
let PAGINA = 1;
const PAGE_SIZE = 12;

// helpers UI
const $ = (s) => document.querySelector(s);
const norm = (s) => (s || "").toString().toLowerCase().trim();

function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1400);
}
function openSoliModal({ title, msg }) {
  const m = $("#soliModal");
  if (!m) return;
  $("#soliTitle").textContent = title || "Solicitud enviada";
  $("#soliMsg").textContent = msg || "¡Tu solicitud fue enviada!";
  m.hidden = false;
}
function closeSoliModal() {
  const m = $("#soliModal");
  if (m) m.hidden = true;
}
document.addEventListener("click", (e) => {
  if (e.target.id === "soliOk" || e.target.id === "soliClose" || e.target.id === "soliModal") closeSoliModal();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSoliModal(); });

// Estilos inyectados (feed)
(function injectStyles() {
  if (document.getElementById("muye-feed-style")) return;
  const style = document.createElement("style");
  style.id = "muye-feed-style";
  style.textContent = `
    #filtros-feed{width:100%;margin:12px 0 10px;padding:10px 14px;display:flex;gap:12px;align-items:center;background:#fff;border-radius:0;box-shadow:0 2px 10px rgba(0,0,0,.06)}
    #filtroUbicacion{padding:10px 12px;border-radius:10px;border:1px solid #ddd;min-width:220px}
    #contenedor-mascotas{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;padding:8px 0 24px}
    .publicacion{background:#fff;border-radius:16px;box-shadow:0 2px 10px rgba(0,0,0,.06);overflow:hidden;position:relative}
    .publicacion img{width:100%;height:220px;object-fit:cover;display:block}
    .publicacion-content{padding:12px 14px}
    #paginacion{width:100%;display:flex;justify-content:center;align-items:center;gap:12px;margin:6px 0 22px}
    #paginacion button{padding:8px 12px;border-radius:10px;border:1px solid #ddd;background:#fff;cursor:pointer}
    #paginaInfo{min-width:90px;text-align:center}

    .muye-ribbon{position:absolute;top:10px;left:-6px;background:#6fcf97;color:#fff;font-weight:700;padding:6px 12px;border-radius:8px;box-shadow:0 3px 10px rgba(0,0,0,.1);transform:rotate(-6deg)}
    .publicacion.adoptada{opacity:.95}
    .publicacion.adoptada img{filter:grayscale(15%)}

    .btn-adoptar {
      background: #13806c; color: #fff; border: none; border-radius: 12px;
      padding: 10px 16px; font-weight: 600; cursor: pointer; width: 100%;
      margin-top: 8px; transition: background 0.2s, transform 0.1s;
    }
    .btn-adoptar:hover { background: #0f6a5a; transform: translateY(-2px); }
    .btn-adoptar:disabled { background: #ccc; cursor: not-allowed; transform: none; }

    .btn-denunciar{
      margin-top:8px; width:100%; padding:8px 12px; border-radius:10px;
      border:1px solid #e3e3e3; background:#fafafa; cursor:pointer; font-weight:600;
    }
    .btn-denunciar:hover{ background:#f2f2f2; }
  `;
  document.head.appendChild(style);
})();

// Chequeo UI
function ensureUI() {
  if (!document.getElementById("filtroUbicacion")) {
    console.warn("Falta #filtroUbicacion en inicio.html");
  }
}

// Orden fecha
function ordenarPorFecha(arr) {
  return arr.slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

// Poblar ubicaciones
function poblarUbicaciones(data) {
  const selUbic = $("#filtroUbicacion");
  if (!selUbic) return;
  const ubic = Array.from(new Set(data.map((m) => m.ubicacion).filter(Boolean))).sort();
  selUbic.length = 1;
  ubic.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u; opt.textContent = u;
    selUbic.appendChild(opt);
  });
}

// Filtro
function aplicarFiltro() {
  const u = ($("#filtroUbicacion")?.value || "").toLowerCase().trim();
  FILTRADAS = TODAS.filter((m) => !u || norm(m.ubicacion) === u);
  FILTRADAS = ordenarPorFecha(FILTRADAS);
  PAGINA = 1;
  renderLista(); renderPaginacion();
}

// Render
function renderLista() {
  const cont = $("#contenedor-mascotas");
  if (!cont) return;
  cont.innerHTML = "";

  if (!FILTRADAS.length) {
    cont.innerHTML = "<p>No hay mascotas que coincidan con la ubicación seleccionada.</p>";
    return;
  }
  const start = (PAGINA - 1) * PAGE_SIZE;
  const pageItems = FILTRADAS.slice(start, start + PAGE_SIZE);

  pageItems.forEach((m) => {
    const isAdopted = m.estado === "adoptada";
    const card = document.createElement("div");
    card.className = "publicacion" + (isAdopted ? " adoptada" : "");
    card.innerHTML = `
      ${isAdopted ? `<span class="muye-ribbon">Adoptada</span>` : ""}
      <img src="${m.foto || 'loguito.png'}"
         onerror="this.onerror=null;this.src='loguito.png';"
         alt="${m.nombre || 'Mascota'}" loading="lazy" decoding="async">


      <div class="publicacion-content">
        <h3>¡Hola! Soy ${m.nombre}</h3>
        <p>${m.edad ? `Tengo ${m.edad} año(s)` : ""}${m.tipo ? ` - ${m.tipo}` : ""}</p>
        <p>${m.descripcion || ""}</p>
        <p>Ubicación: ${m.ubicacion || "—"}</p>
        ${ isAdopted
            ? `<button class="btn-adoptar" disabled>Adoptada</button>`
            : `<button class="btn-adoptar" data-id="${m.id || ""}">Adoptar</button>`
        }
        <button class="btn-denunciar" data-id="${m.id || ""}">Denunciar</button>
      </div>
    `;
    if (!isAdopted) {
      const btn = card.querySelector(".btn-adoptar");
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (!id) { toast("Publicación antigua sin solicitud automática"); return; }
        if (!(window.sesionVigente && window.sesionVigente())) { window.location.href = "registro.html"; return; }
        abrirModal(id);
      });
    }
    cont.appendChild(card);
  });
}

// Paginación
function totalPaginas() { return Math.max(1, Math.ceil(FILTRADAS.length / PAGE_SIZE)); }
function renderPaginacion() {
  $("#paginaInfo") && ($("#paginaInfo").textContent = `${PAGINA} / ${totalPaginas()}`);
  $("#btnPrev") && ($("#btnPrev").disabled = PAGINA <= 1);
  $("#btnNext") && ($("#btnNext").disabled = PAGINA >= totalPaginas());
}
function irPrev() { if (PAGINA > 1) { PAGINA--; renderLista(); renderPaginacion(); } }
function irNext() { if (PAGINA < totalPaginas()) { PAGINA++; renderLista(); renderPaginacion(); } }

// Cargar datos
function cargarMascotas() {
  fetch("/api/mascotas")
    .then((r) => r.json())
    .then((mascotas) => {
      TODAS = Array.isArray(mascotas) ? mascotas.slice() : [];
      poblarUbicaciones(TODAS);
      FILTRADAS = ordenarPorFecha(TODAS);
      PAGINA = 1;
      renderLista(); renderPaginacion();
    })
    .catch(() => { $("#contenedor-mascotas").innerHTML = "<p>Error cargando el feed.</p>"; });
}

// Modal “Solicitud de adopción” (con textarea)
let MASCOTA_SELECCIONADA = null;
function crearModal() {
  const d = document.getElementById("muyeBackdrop");
  if (!d) return;
  $("#muyeCancelar").onclick = cerrarModal;
  $("#muyeEnviar").onclick = () => enviarSolicitud();
}
function abrirModal(idMascota) { MASCOTA_SELECCIONADA = idMascota; const b = $("#muyeBackdrop"); if (b) { b.style.display = "flex"; $("#muyeMensaje").value = ""; } }
function cerrarModal() { const b = $("#muyeBackdrop"); if (b) b.style.display = "none"; }

// Enviar solicitud (maneja duplicado y modal de confirmación)
async function enviarSolicitud() {
  const interesadoEmail =
    (window.getUsuarioEmail && window.getUsuarioEmail()) ||
    localStorage.getItem("usuarioEmail") || "";
  if (!interesadoEmail) { window.location.href = "login.html"; return; }

  const idMascota = String(MASCOTA_SELECCIONADA || "");
  const mensaje = ($("#muyeMensaje")?.value || "").trim();

  try {
    const resp = await fetch("/api/solicitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idMascota, mensaje, interesadoEmail }),
    });
    const j = await resp.json().catch(() => ({ ok: false }));

    if (j && j.ok === false && j.reason === "duplicate") {
      cerrarModal();
      openSoliModal({ title: "Ya enviaste una solicitud", msg: "Para esta mascota ya existe una solicitud tuya en estado pendiente o aceptada." });
      return;
    }
    if (resp.ok && j.ok) {
      cerrarModal();
      openSoliModal({ title: "¡Solicitud enviada!", msg: "Avisamos al dueño. Podés seguir el estado desde Mis solicitudes." });
      return;
    }
    toast("No pudimos enviar la solicitud. Intentá de nuevo.");
  } catch (e) {
    console.error(e);
    toast("Error de red. Probá de nuevo.");
  }
}

// Header según sesión
function armarHeader() {
  const info = document.getElementById("info-usuario");
  if (!info) return;
  const nombre = localStorage.getItem("usuarioNombre") || "";
  const haySesion = window.sesionVigente && window.sesionVigente();
  if (haySesion) {
    info.innerHTML = `
      <span>Hola, <b>${nombre || "usuario"}</b></span>
      <button id="btnCerrarSesion" class="btn-cerrar-sesion">Cerrar sesión</button>
    `;
    document.getElementById("btnCerrarSesion").onclick = window.cerrarSesion;
  } else {
    info.innerHTML = `
      <a href="login.html" class="btn-iniciar-sesion">Iniciar sesión</a>
      <a href="registro.html" class="btn-crear-cuenta">Crear cuenta</a>
    `;
  }
}

// Eventos y arranque
function wireEventos() {
  $("#filtroUbicacion")?.addEventListener("change", aplicarFiltro);
  $("#btnPrev")?.addEventListener("click", () => irPrev());
  $("#btnNext")?.addEventListener("click", () => irNext());
}

document.addEventListener("DOMContentLoaded", () => {
  armarHeader(); ensureUI(); crearModal(); wireEventos(); cargarMascotas();
});

// RIBBON extra (por si cambias estructura de cards en el futuro)
(function(){
  const GRID =
    document.getElementById("contenedor-mascotas") ||
    document.querySelector("#grid, #cards, .cards, .lista-mascotas");
  function pintarRibbons(){
    const cards = (GRID || document).querySelectorAll(".card, .tarjeta, .card-feed");
    cards.forEach(card=>{
      if (card.querySelector(".muye-ribbon")) return;
      const dataEstado = (card.getAttribute("data-estado") || "").toLowerCase().trim();
      const btnAdopt = card.querySelector("button[disabled], .btn[disabled]");
      const textHasAdoptada = /adoptada/i.test(card.textContent || "");
      const isAdopted = (dataEstado === "adoptada") || (btnAdopt && textHasAdoptada);
      if (isAdopted) {
        const span = document.createElement("span");
        span.className = "muye-ribbon";
        span.textContent = "Adoptada";
        card.appendChild(span);
      }
    });
  }
  document.addEventListener("DOMContentLoaded", pintarRibbons);
  if (GRID) {
    const obs = new MutationObserver(()=> requestAnimationFrame(pintarRibbons));
    obs.observe(GRID, { childList: true });
  }
  window._pintarRibbonsFeed = pintarRibbons;
})();

// === Denunciar (listener global) ===
document.addEventListener("click", async (e)=>{
  const b = e.target.closest(".btn-denunciar");
  if(!b) return;
  const motivo = prompt("Contanos brevemente qué viste:");
  if(!motivo) return;
  try{
    const r = await fetch("/api/denuncias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idMascota: b.dataset.id,
        motivo: motivo.slice(0,500),
        denunciante: localStorage.getItem("usuarioEmail") || "",
        fecha: Date.now()
      })
    });
    if(!r.ok) throw new Error("HTTP " + r.status);
    alert("Gracias por avisar. Lo vamos a revisar.");
  }catch{
    alert("No pudimos enviar tu denuncia, probá más tarde.");
  }
});

