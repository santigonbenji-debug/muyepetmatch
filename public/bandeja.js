// Bandeja — muestra empty state dentro del grid si no hay #empty
let TODAS = [];
let FILTRADAS = [];
let MASCOTAS = new Map();
let USUARIOS = new Map();
let PAGE = 1;
const PAGE_SIZE = 8;
const $ = (s) => document.querySelector(s);

const norm = (s)=> (s||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const fmt  = (t)=> new Date(Number(t||Date.now())).toLocaleString();

function toast(msg){ const t=$("#toast"); if(!t) return; t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1300); }

async function cambiarEstadoSolicitud(id, estado, inter = {}) {
  const resp = await fetch("/api/solicitudes/estado", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, estado, inter }),
  });
  const j = await resp.json().catch(() => ({}));
  if (!resp.ok || !j.ok) throw new Error(j.error || "No se pudo actualizar el estado");
  return j;
}

async function loadData() {
  const duenio = (window.getUsuarioEmail && window.getUsuarioEmail()) || localStorage.getItem("usuarioEmail") || "";
  if (!duenio) return;

  const [soliRes, masRes, usuRes] = await Promise.all([
    fetch(`/api/solicitudes?duenioEmail=${encodeURIComponent(duenio)}`),
    fetch(`/api/mascotas`),
    fetch(`/api/usuarios-publicos`)
  ]);
  const [solicitudes, mascotas, usuarios] = await Promise.all([soliRes.json(), masRes.json(), usuRes.json()]);

  MASCOTAS = new Map((mascotas||[]).map(m=>[String(m.id), m]));
  USUARIOS = new Map((usuarios||[]).map(u=>[String((u.email||"").toLowerCase()), u]));

  TODAS = (solicitudes||[]).map(s=>{
    const m = MASCOTAS.get(String(s.idMascota)) || {};
    const du = USUARIOS.get((s.duenioEmail||"").toLowerCase()) || {};
    const inU= USUARIOS.get((s.interesadoEmail||"").toLowerCase()) || {};
    return {
      ...s,
      petNombre: m.nombre || "(Mascota)",
      petFoto: m.foto || "loguito.png",
      petTipo: m.tipo || "",
      petUbic: m.ubicacion || "",
      dueno: { nombre: du.nombre || "(sin nombre)", email: du.email || s.duenioEmail || "", telefono: du.telefono || "", whatsapp: du.whatsapp || "", alias: du.alias || "" },
      interesado: { nombre: inU.nombre || "(sin nombre)", email: inU.email || s.interesadoEmail || "", telefono: inU.telefono || "", whatsapp: inU.whatsapp || "", alias: inU.alias || "" },
    };
  }).sort((a,b)=> b.fecha - a.fecha);

  aplicarFiltros();
}

function aplicarFiltros(){
  const estado = $("#filterEstado")?.value || "";
  const q = norm($("#search")?.value || "");
  FILTRADAS = TODAS.filter(s=>{
    const okEstado = !estado || s.estado === estado;
    const matchTxt = !q || norm(s.petNombre).includes(q) || norm(s.interesadoEmail).includes(q);
    return okEstado && matchTxt;
  });
  PAGE = 1;
  render();
}

function emptyHTML(){
  return `
    <div style="max-width:520px;margin:60px auto;text-align:center;opacity:.9">
      <div style="font-size:60px;line-height:1;margin-bottom:10px">📭</div>
      <h3>No tenés solicitudes recibidas</h3>
      <p>Cuando alguien te contacte por una de tus mascotas, va a aparecer acá.</p>
      <a href="inicio.html" style="display:inline-block;margin-top:14px;padding:10px 16px;border-radius:12px;background:#f3e7df;text-decoration:none;color:#233">Ir al inicio</a>
    </div>`;
}

function cardHTML(s){
  const estadoClass = `estado ${s.estado}`;
  const puedeDecidir = s.estado === "pendiente";
  const waUrl = (window.buildWaLink && window.buildWaLink(s.interesado?.whatsapp || s.interesado?.telefono || "")) || "";

  const contactos =
    s.estado === "aceptada"
      ? `<div style="padding:12px;border-top:1px solid var(--borde,#e9e6e6);background:#fcfcfc">
          ${contactoHTML("Dueño", s.dueno)}
          <div style="height:8px"></div>
          ${contactoHTML("Interesado", s.interesado)}
          <div style="margin-top:8px">
            <a class="controls-btn" href="mailto:${s.interesado.email}" style="padding:8px 12px;border:1px solid #e9e6e6;border-radius:10px;background:#fff;display:inline-block;margin-right:8px">Email</a>
            ${ waUrl ? `<a class="controls-btn" href="${waUrl}" target="_blank" rel="noopener" style="padding:8px 12px;border:1px solid #e9e6e6;border-radius:10px;background:#e8f8ef;display:inline-block">WhatsApp</a>` : "" }

          </div>
        </div>` : "";
  return `
    <article class="card">
      <div class="pet">
        <img src="${s.petFoto}" alt="${s.petNombre}">
        <div>
          <h3>${s.petNombre}</h3>
          <div class="meta">${s.petTipo ? s.petTipo + " · " : ""}${s.petUbic || ""}</div>
          <div class="meta">${fmt(s.fecha)}</div>
        </div>
      </div>
      <div class="msg">${s.mensaje ? s.mensaje.replace(/</g,"&lt;") : "(sin mensaje)"}</div>
      <div class="footer">
        <span class="${estadoClass}">${s.estado.charAt(0).toUpperCase()+s.estado.slice(1)}</span>
        <div class="acciones">
          ${ puedeDecidir
              ? `<button class="yes" data-accion="aceptada" data-id="${s.id}">Aceptar</button>
                 <button class="no"  data-accion="rechazada" data-id="${s.id}">Rechazar</button>`
              : `<button disabled>Gestionada</button>` }
        </div>
      </div>
      ${contactos}
    </article>`;
}
function contactoHTML(titulo,u){
  const telWa = (u.telefono ? "Tel: "+u.telefono : "") + (u.whatsapp ? (u.telefono ? " · " : "")+"WhatsApp: "+u.whatsapp : "");
  return `<div style="margin-top:10px;font-size:14px"><strong>${titulo}:</strong> ${u.nombre||"(sin nombre)"}<br><strong>Email:</strong> <a href="mailto:${u.email}">${u.email}</a><br>${telWa ? telWa : '<span style="opacity:.7">Aún no cargó teléfono/WhatsApp.</span>'}</div>`;
}

function render(){
  const grid = $("#grid");
  if (!grid) return;

  if (!FILTRADAS.length) {
    grid.innerHTML = emptyHTML(); // 👈 ahora SIEMPRE muestra vacío visible
    $("#pageInfo") && ($("#pageInfo").textContent = "0 / 0");
    $("#prev") && ($("#prev").disabled = true);
    $("#next") && ($("#next").disabled = true);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(FILTRADAS.length / PAGE_SIZE));
  if (PAGE > totalPages) PAGE = totalPages;
  const start = (PAGE - 1) * PAGE_SIZE;
  const pageItems = FILTRADAS.slice(start, start + PAGE_SIZE);

  grid.innerHTML = pageItems.map(cardHTML).join("");

  grid.querySelectorAll("[data-accion]").forEach(btn=>{
    btn.onclick = async ()=>{
      const id = btn.dataset.id;
      const estado = btn.dataset.accion;
      try {
        await cambiarEstadoSolicitud(id, estado, {});
        const i = TODAS.findIndex(x=> String(x.id)===String(id));
        if (i>-1) TODAS[i].estado = estado;
        aplicarFiltros();
        toast(estado==="aceptada" ? "Solicitud aceptada" : "Solicitud rechazada");
      } catch(e){ console.error(e); toast("No se pudo actualizar"); }
    };
  });

  $("#pageInfo") && ($("#pageInfo").textContent = `${PAGE} / ${totalPages}`);
  $("#prev") && ($("#prev").disabled = PAGE <= 1);
  $("#next") && ($("#next").disabled = PAGE >= totalPages);
}

document.addEventListener("DOMContentLoaded", ()=>{
  if (!(window.sesionVigente && window.sesionVigente())) return;
  $("#filterEstado")?.addEventListener("change", aplicarFiltros);
  $("#search")?.addEventListener("input", ()=>{ clearTimeout(window._t); window._t = setTimeout(aplicarFiltros, 150); });
  $("#btnRefresh")?.addEventListener("click", loadData);
  $("#prev")?.addEventListener("click", ()=>{ if(PAGE>1){ PAGE--; render(); } });
  $("#next")?.addEventListener("click", ()=>{ PAGE++; render(); });
  loadData();
});
