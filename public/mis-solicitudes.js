// ===== mis-solicitudes.js (versión robusta) =====
const $ = (s) => document.querySelector(s);
const onlyDigits = (s) => (s || "").toString().replace(/\D+/g, "");

// Normalizador WA local (usa el global si existe)
function waFrom(raw) {
  if (window.buildWaLink) return window.buildWaLink(raw);
  let d = onlyDigits(raw);
  if (!d) return "";
  // Quita 0 inicial (larga distancia) y el "15" post-código de área
  if (d.startsWith("0")) d = d.slice(1);
  d = d.replace(/^(\d{2,4})15/, "$1");
  // Si no trae país, anteponer 54 + 9 (móvil AR)
  if (!d.startsWith("54")) d = "549" + d;
  return `https://wa.me/${d}`;
}

// Carga de datos
async function load() {
  try {
    const interesado = (window.getUsuarioEmail && window.getUsuarioEmail()) || "";
    if (!interesado) {
      // Por si entraron directo, reforzamos protección
      location.href = "login.html?next=mis-solicitudes.html";
      return;
    }

    const [soliRes, masRes, usuRes] = await Promise.all([
      fetch(`/api/solicitudes?interesadoEmail=${encodeURIComponent(interesado)}`),
      fetch(`/api/mascotas`),
      fetch(`/api/usuarios-publicos`)
    ]);

    if (!soliRes.ok || !masRes.ok || !usuRes.ok) {
      throw new Error("No se pudo consultar la API");
    }

    const [solicitudes, mascotas, usuarios] = await Promise.all([
      soliRes.json(), masRes.json(), usuRes.json()
    ]);

    const M = new Map((mascotas || []).map(m => [String(m.id), m]));
    const U = new Map((usuarios || []).map(u => [String((u.email || "").toLowerCase()), u]));

    const items = (solicitudes || [])
      .slice()
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) // robusto
      .map((s) => {
        const m  = M.get(String(s.idMascota)) || {};
        const du = U.get((s.duenioEmail || "").toLowerCase()) || {};
        return {
          ...s,
          petNombre: m?.nombre || "(Mascota)",
          petFoto:   m?.foto   || "loguito.png",
          petTipo:   m?.tipo   || "",
          petUbic:   m?.ubicacion || "",
          petEstado: m?.estado || "disponible",
          contactoDuenio: {
            nombre:   du.nombre   || "",
            email:    du.email    || s.duenioEmail,
            telefono: du.telefono || "",
            whatsapp: du.whatsapp || "",
            alias:    du.alias    || ""
          }
        };
      });

    render(items);
  } catch (err) {
    console.error("[mis-solicitudes] error:", err);
    const grid = $("#grid");
    const empty = $("#empty");
    if (grid) grid.innerHTML = "";
    if (empty) {
      empty.textContent = "No pudimos cargar tus solicitudes. Probá actualizar.";
      empty.style.display = "block";
    }
  }
}

// BOTONES de contacto (solo si está ACEPTADA)
function contactButtons(s) {
  if (s.estado !== "aceptada") return "";
  const c = s.contactoDuenio || {};
  const waUrl = waFrom(c.whatsapp || c.telefono);
  const tel   = onlyDigits(c.telefono);
  const mail  = c.email || s.duenioEmail;

  const links = [];
  if (waUrl) links.push(
    `<a class="actions whats" target="_blank" rel="noopener" href="${waUrl}">WhatsApp</a>`
  );
  if (tel) links.push(`<a class="actions tel" href="tel:${tel}">Llamar</a>`);
  if (mail) links.push(`<a class="actions" href="mailto:${mail}">Email</a>`);

  return `<div class="actions" style="display:flex;gap:8px;flex-wrap:wrap;">${links.join("")}</div>`;
}

// INFO visible de contacto
function contactInfo(s) {
  if (s.estado !== "aceptada") return "";
  const c = s.contactoDuenio || {};
  const waUrl = waFrom(c.whatsapp || c.telefono);
  const tel   = onlyDigits(c.telefono);
  const mail  = c.email || s.duenioEmail;

  return `
    <div style="padding:8px 12px 12px; font-size:14px; opacity:.9">
      <div><b>Dueño:</b> ${c.nombre || "(sin nombre)"}</div>
      <div><b>Email:</b> <a href="mailto:${mail}">${mail}</a></div>
      ${tel ? `<div><b>Teléfono:</b> <a href="tel:${tel}">${c.telefono}</a></div>` : ""}
      ${waUrl ? `<div><b>WhatsApp:</b> <a target="_blank" rel="noopener" href="${waUrl}">${c.whatsapp || c.telefono}</a></div>` : ""}
      ${!tel && !waUrl && !c.nombre ? `<div style="opacity:.7">El dueño todavía no cargó teléfono/WhatsApp.</div>` : ""}
    </div>
  `;
}

// RENDER de tarjetas
function render(items) {
  const grid = $("#grid");
  const empty = $("#empty");
  if (!grid || !empty) return; // evita crash si faltan contenedores

  if (!items.length) {
    grid.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  grid.innerHTML = items.map((s) => `
    <article class="card">
      <div class="pet">
        <img src="${s.petFoto}" alt="${s.petNombre}" onerror="this.src='loguito.png'">
        <div>
          <h3>${s.petNombre}</h3>
          <div class="meta">${s.petTipo ? s.petTipo + " · " : ""}${s.petUbic || ""}</div>
          <div class="meta">${new Date(s.fecha).toLocaleString()}</div>
        </div>
      </div>
      <div class="msg">${s.mensaje ? s.mensaje.replace(/</g, "&lt;") : "(sin mensaje)"}</div>
      <div class="footer">
        <span class="estado ${s.estado}">${s.estado}</span>
        ${contactButtons(s)}
      </div>
      ${contactInfo(s)}
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", load);
