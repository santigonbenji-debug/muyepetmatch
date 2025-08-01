const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('fotos'));

// Crear carpeta 'fotos' si no existe
if (!fs.existsSync('fotos')) {
  fs.mkdirSync('fotos');
}

// Configurar multer para guardar imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'fotos');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });


// HTML routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "registro.html")));
app.get("/registro", (req, res) => res.sendFile(path.join(__dirname, "registro.html")));
app.get("/inicio", (req, res) => res.sendFile(path.join(__dirname, "inicio.html")));


// REGISTRO de usuario
app.post("/api/registro", (req, res) => {
  const nuevoUsuario = req.body;

  fs.readFile("usuarios.json", "utf8", (err, data) => {
    let usuarios = [];

    if (!err && data) {
      try {
        usuarios = JSON.parse(data);
      } catch {
        return res.status(500).send("Error al parsear JSON");
      }
    }

    usuarios.push(nuevoUsuario);

    fs.writeFile("usuarios.json", JSON.stringify(usuarios, null, 2), (err) => {
      if (err) return res.status(500).send("Error al guardar usuario");
      res.status(200).json({ mensaje: "Usuario registrado" });
    });
  });
});


// PUBLICACIÓN de mascota
app.post('/publicar-mascota', upload.single('foto'), (req, res) => {
  const { nombre, edad, tipo, descripcion, ubicacion } = req.body;
  const imagen = req.file ? req.file.filename : null;

  if (!nombre || !edad || !tipo || !descripcion || !ubicacion || !imagen) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }

  const nuevaMascota = {
    nombre,
    edad,
    tipo,
    descripcion,
    ubicacion,
    imagen
  };

  const archivoMascotas = path.join(__dirname, 'mascotas.json');

  fs.readFile(archivoMascotas, 'utf8', (err, data) => {
    let mascotas = [];

    if (!err && data) {
      try {
        mascotas = JSON.parse(data);
      } catch (error) {
        return res.status(500).json({ mensaje: 'Error al leer archivo de mascotas' });
      }
    }

    mascotas.push(nuevaMascota);

    fs.writeFile(archivoMascotas, JSON.stringify(mascotas, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ mensaje: 'Error al guardar la mascota' });
      }

      res.status(200).json({ mensaje: 'Mascota publicada con éxito' });
    });
  });
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

