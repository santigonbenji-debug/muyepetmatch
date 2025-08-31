// server.js — Muyè PetMatch (fix endpoints + validaciones + hash + denuncias)

const express = require("express");
const fssync = require("fs");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

/* ----------------- Helpers usuarios ----------------- */
const USERS_PATH = path.join(__dirname, "usuarios.json");
async function readUsers() {
  try {
    return JSON.parse((await fs.readFile(USERS_PATH, "utf8")) || "[]");
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}
async function writeUsers(users) {
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2), "utf8");
}
function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

/* ----------------- App base ----------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Limitar golpes a la API (200 cada 15')
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// Limitar login (20 cada 10')
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/fotos", express.static(path.join(__dirname, "public", "fotos")));

/* Migración: asegurar id/createdAt en mascotas viejas */
(function ensureIdsOnMascotas() {
  const archivo = path.join(__dirname, "mascotas.json");
  try {
    if (!fssync.existsSync(archivo)) return;
    const data = JSON.parse(fssync.readFileSync(archivo, "utf8") || "[]");
    let changed = false;
    let base = Date.now() - data.length * 1000;
    data.forEach((m, i) => {
      if (!m.id) {
        m.id = base + i;
        changed = true;
      }
      if (!m.createdAt) {
        m.createdAt = base + i;
        changed = true;
      }
    });
    if (changed) fssync.writeFileSync(archivo, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error migrando mascotas:", e);
  }
})();

/* ----------------- Páginas ----------------- */
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html")),
);
app.get("/inicio", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "inicio.html")),
);
app.get("/registro", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "registro.html")),
);
app.get("/login", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html")),
);
app.get("/publicar", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "publicar.html")),
);
app.get("/mis-mascotas", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "mis-mascotas.html")),
);
app.get("/bandeja", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "bandeja.html")),
);
app.get("/mis-solicitudes", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "mis-solicitudes.html")),
);
app.get("/mascotas.json", (_, res) =>
  res.sendFile(path.join(__dirname, "mascotas.json")),
); // debug

/* ----------------- Uploads ----------------- */
function isImage(mt) {
  return ["image/jpeg", "image/png", "image/webp"].includes(mt);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, "public", "fotos");
    if (!fssync.existsSync(dir)) fssync.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, "_")}`),
});
const storagePerfil = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, "public", "fotos", "perfiles");
    if (!fssync.existsSync(dir)) fssync.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, "_")}`),
});

const uploadMascota = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    !isImage(file.mimetype)
      ? cb(new Error("TIPO_NO_PERMITIDO"))
      : cb(null, true),
});
const uploadPerfil = multer({
  storage: storagePerfil,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    !isImage(file.mimetype)
      ? cb(new Error("TIPO_NO_PERMITIDO"))
      : cb(null, true),
});

/* ----------------- API USUARIOS ----------------- */
// Login con migración a hash
app.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    if (!email || !password)
      return res.status(400).json({ ok: false, error: "FALTAN_CAMPOS" });

    const usuarios = await readUsers();
    const u = usuarios.find((x) => normalizeEmail(x.email) === email);
    if (!u)
      return res
        .status(401)
        .json({ ok: false, error: "CREDENCIALES_INVALIDAS" });

    let ok = false;
    if (u.password && u.password.length < 55) {
      ok = u.password === password;
      if (ok) {
        u.password = await bcrypt.hash(password, 10); // migramos
        await writeUsers(usuarios);
      }
    } else {
      ok = await bcrypt.compare(password, u.password || "");
    }

    if (!ok)
      return res
        .status(401)
        .json({ ok: false, error: "CREDENCIALES_INVALIDAS" });
    return res.json({
      ok: true,
      usuario: { id: u.id, nombre: u.nombre, email: u.email },
    });
  } catch (e) {
    console.error("LOGIN:", e);
    return res.status(500).json({ ok: false, error: "ERROR_INTERNO" });
  }
});

// Registro (guarda hash + campos opcionales)
app.post("/api/registro", async (req, res) => {
  try {
    const nombre = String(req.body.nombre || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "").trim();

    const ubicacion = String(req.body.ubicacion || "").trim();
    const telefono = String(req.body.telefono || "").trim();
    const whatsapp = String(req.body.whatsapp || "").trim();
    const alias = String(req.body.alias || "")
      .trim()
      .replace(/^@+/, "");
    const sobremi = String(req.body.sobremi || req.body.sobreMi || "").trim();

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, error: "FALTAN_CAMPOS" });
    }

    const usuarios = await readUsers();
    if (usuarios.some((u) => normalizeEmail(u.email) === email)) {
      return res.status(409).json({ ok: false, error: "EMAIL_EXISTS" });
    }

    const hash = await bcrypt.hash(password, 10);

    const nuevo = {
      id: Date.now(),
      nombre,
      email,
      password: hash, // ✅ guardamos hash
      ubicacion,
      telefono,
      whatsapp,
      alias,
      sobremi,
      fotoPerfil: "",
      creadoEn: new Date().toISOString(),
    };

    usuarios.push(nuevo);
    await writeUsers(usuarios);

    return res.json({
      ok: true,
      usuario: { id: nuevo.id, nombre: nuevo.nombre, email: nuevo.email },
    });
  } catch (e) {
    console.error("REGISTRO:", e);
    return res.status(500).json({ ok: false, error: "ERROR_INTERNO" });
  }
});

// Lista pública mínima (sin password)
app.get("/api/usuarios-publicos", async (_req, res) => {
  const usuarios = await readUsers().catch(() => []);
  res.json(
    usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre || "",
      email: u.email || "",
      fotoPerfil: u.fotoPerfil || "",
      telefono: u.telefono || "",
      whatsapp: u.whatsapp || "",
      alias: u.alias || "",
    })),
  );
});

// Un usuario por email
app.get("/api/usuario", async (req, res) => {
  const email = normalizeEmail(req.query.email || "");
  const usuarios = await readUsers().catch(() => []);
  const u = usuarios.find((x) => normalizeEmail(x.email) === email);
  if (!u) return res.status(404).json({ ok: false });
  res.json({
    ok: true,
    usuario: {
      id: u.id,
      nombre: u.nombre || "",
      email: u.email || "",
      ubicacion: u.ubicacion || "",
      telefono: u.telefono || "",
      whatsapp: u.whatsapp || "",
      alias: u.alias || "",
      sobreMi: u.sobremi || u.sobreMi || "",
      fotoPerfil: u.fotoPerfil || "",
    },
  });
});

// Actualizar usuario
app.post("/api/actualizar-usuario", (req, res) => {
  const datos = req.body;
  try {
    const usuarios = JSON.parse(
      fssync.readFileSync(USERS_PATH, "utf8") || "[]",
    );
    const i = usuarios.findIndex(
      (u) => normalizeEmail(u.email) === normalizeEmail(datos.email),
    );
    if (i === -1)
      return res
        .status(404)
        .json({ ok: false, error: "Usuario no encontrado" });
    usuarios[i] = { ...usuarios[i], ...datos };
    fssync.writeFileSync(USERS_PATH, JSON.stringify(usuarios, null, 2));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: "Error procesando usuarios" });
  }
});

// Subir foto de perfil
app.post(
  "/api/usuario/foto",
  uploadPerfil.single("fotoPerfil"),
  async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      if (!email)
        return res.status(400).json({ ok: false, error: "FALTA_EMAIL" });
      if (!req.file)
        return res.status(400).json({ ok: false, error: "FALTA_ARCHIVO" });
      const usuarios = await readUsers();
      const i = usuarios.findIndex((u) => normalizeEmail(u.email) === email);
      if (i === -1)
        return res
          .status(404)
          .json({ ok: false, error: "USUARIO_NO_ENCONTRADO" });
      const publicPath = `/fotos/perfiles/${req.file.filename}`;
      usuarios[i].fotoPerfil = publicPath;
      await writeUsers(usuarios);
      res.json({ ok: true, fotoPerfil: publicPath });
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok: false, error: "ERROR_INTERNO" });
    }
  },
);

/* ----------------- API MASCOTAS ----------------- */
app.post("/api/publicar", uploadMascota.single("foto"), (req, res) => {
  const ahora = Date.now();
  const mascota = {
    id: ahora,
    nombre: req.body.nombre,
    edad: req.body.edad,
    tipo: req.body.tipo,
    descripcion: req.body.descripcion,
    ubicacion: req.body.ubicacion,
    foto: req.file ? "/fotos/" + req.file.filename : null,
    usuarioEmail: req.body.usuarioEmail,
    createdAt: ahora,
    estado: "disponible",
  };
  const archivo = path.join(__dirname, "mascotas.json");
  try {
    const arr = fssync.existsSync(archivo)
      ? JSON.parse(fssync.readFileSync(archivo, "utf8") || "[]")
      : [];
    arr.push(mascota);
    fssync.writeFileSync(archivo, JSON.stringify(arr, null, 2));
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: "Error guardando mascota" });
  }
});

app.get("/api/mascotas", (_req, res) => {
  const archivo = path.join(__dirname, "mascotas.json");
  try {
    res.json(JSON.parse(fssync.readFileSync(archivo, "utf8") || "[]"));
  } catch {
    res.json([]);
  }
});

app.post("/api/mascotas/:id/estado", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (!estado)
    return res.status(400).json({ ok: false, error: "Falta 'estado'" });
  const archivo = path.join(__dirname, "mascotas.json");
  let mascotas = [];
  try {
    mascotas = JSON.parse(fssync.readFileSync(archivo, "utf8") || "[]");
  } catch {}
  const i = mascotas.findIndex((m) => String(m.id) === String(id));
  if (i === -1)
    return res.status(404).json({ ok: false, error: "Mascota no encontrada" });
  mascotas[i].estado = estado;
  try {
    fssync.writeFileSync(archivo, JSON.stringify(mascotas, null, 2));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: "No se pudo guardar" });
  }
});

app.patch("/api/mascotas/:id", (req, res) => {
  const { id } = req.params;
  const allowed = [
    "nombre",
    "edad",
    "tipo",
    "descripcion",
    "ubicacion",
    "foto",
  ];
  const cambios = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) cambios[k] = req.body[k];
  });
  const archivo = path.join(__dirname, "mascotas.json");
  try {
    const mascotas = JSON.parse(fssync.readFileSync(archivo, "utf8") || "[]");
    const i = mascotas.findIndex((m) => String(m.id) === String(id));
    if (i === -1)
      return res
        .status(404)
        .json({ ok: false, error: "Mascota no encontrada" });
    mascotas[i] = { ...mascotas[i], ...cambios, updatedAt: Date.now() };
    fssync.writeFileSync(archivo, JSON.stringify(mascotas, null, 2));
    res.json({ ok: true, mascota: mascotas[i] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.delete("/api/mascotas/:id", (req, res) => {
  const { id } = req.params;
  const archivo = path.join(__dirname, "mascotas.json");
  try {
    const mascotas = JSON.parse(fssync.readFileSync(archivo, "utf8") || "[]");
    const i = mascotas.findIndex((m) => String(m.id) === String(id));
    if (i === -1)
      return res
        .status(404)
        .json({ ok: false, error: "Mascota no encontrada" });
    const [b] = mascotas.splice(i, 1);
    fssync.writeFileSync(archivo, JSON.stringify(mascotas, null, 2));
    res.json({ ok: true, id: b.id });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/* ----------------- API SOLICITUDES ----------------- */
app.post("/api/solicitudes", (req, res) => {
  const { idMascota, mensaje, interesadoEmail } = req.body || {};
  if (!idMascota || !interesadoEmail)
    return res
      .status(400)
      .json({ ok: false, error: "Falta idMascota o interesadoEmail" });

  const mp = path.join(__dirname, "mascotas.json");
  const sp = path.join(__dirname, "solicitudes.json");

  let mascotas = [];
  try {
    mascotas = JSON.parse(fssync.readFileSync(mp, "utf8") || "[]");
  } catch {}
  const m = mascotas.find((x) => String(x.id) === String(idMascota));
  if (!m)
    return res.status(404).json({ ok: false, error: "Mascota no encontrada" });

  let actuales = [];
  try {
    actuales = JSON.parse(fssync.readFileSync(sp, "utf8") || "[]");
  } catch {}
  const dup = actuales.some(
    (s) =>
      String(s.idMascota) === String(idMascota) &&
      String(s.interesadoEmail).toLowerCase() ===
        String(interesadoEmail).toLowerCase() &&
      s.estado !== "rechazada",
  );
  if (dup) return res.json({ ok: false, reason: "duplicate" });

  const soli = {
    id: Date.now(),
    idMascota: String(idMascota),
    duenioEmail: m.usuarioEmail,
    interesadoEmail,
    mensaje: mensaje || "",
    estado: "pendiente",
    fecha: Date.now(),
  };
  actuales.push(soli);
  try {
    fssync.writeFileSync(sp, JSON.stringify(actuales, null, 2));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: "Error guardando solicitud" });
  }
});

app.get("/api/solicitudes", (req, res) => {
  const { duenioEmail, interesadoEmail } = req.query || {};
  const sp = path.join(__dirname, "solicitudes.json");
  let arr = [];
  try {
    arr = JSON.parse(fssync.readFileSync(sp, "utf8") || "[]");
  } catch {}
  if (duenioEmail) arr = arr.filter((s) => s.duenioEmail === duenioEmail);
  if (interesadoEmail)
    arr = arr.filter((s) => s.interesadoEmail === interesadoEmail);
  res.json(arr);
});
app.get("/health", (req, res) => {
  res.type("text").send("ok");
});

app.post("/api/solicitudes/estado", (req, res) => {
  const sp = path.join(__dirname, "solicitudes.json");
  let arr = [];
  try {
    arr = JSON.parse(fssync.readFileSync(sp, "utf8") || "[]");
  } catch {}
  const { id, estado, inter = {} } = req.body || {};
  if (!id || !estado)
    return res
      .status(400)
      .json({ ok: false, error: "Faltan 'id' o 'estado'." });
  const i = arr.findIndex((s) => String(s.id) === String(id));
  if (i === -1)
    return res
      .status(404)
      .json({ ok: false, error: "Solicitud no encontrada" });
  arr[i].estado = estado;
  if (estado === "aceptada") {
    arr[i].inter = {
      whatsapp: inter.whatsapp || "",
      telefono: inter.telefono || "",
      contacto: inter.contacto || "",
    };
  }
  try {
    fssync.writeFileSync(sp, JSON.stringify(arr, null, 2));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: "Error actualizando estado" });
  }
});

/* ----------------- API DENUNCIAS ----------------- */
app.post("/api/denuncias", (req, res) => {
  try {
    const { idMascota, motivo, denunciante, fecha } = req.body || {};
    if (!idMascota || !motivo)
      return res.status(400).json({ ok: false, error: "Faltan datos" });
    const archivo = path.join(__dirname, "denuncias.json");
    const arr = fssync.existsSync(archivo)
      ? JSON.parse(fssync.readFileSync(archivo, "utf8") || "[]")
      : [];
    arr.push({
      id: Date.now(),
      idMascota: String(idMascota),
      motivo: String(motivo).slice(0, 500),
      denunciante: denunciante || "",
      fecha: Number(fecha) || Date.now(),
      ip: req.ip,
    });
    fssync.writeFileSync(archivo, JSON.stringify(arr, null, 2));
    res.json({ ok: true });
  } catch (e) {
    console.error("DENUNCIA:", e);
    res.status(500).json({ ok: false, error: "ERROR_INTERNO" });
  }
});
// 404 para API (JSON)
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// 404 para el resto (HTML lindo)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

/* ----------------- Start ----------------- */
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server en http://localhost:${PORT}`),
);
