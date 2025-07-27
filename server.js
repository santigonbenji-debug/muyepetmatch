const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname))); // Sirve todos los archivos estáticos

// Ruta para recibir los registros
app.post('/registrar', (req, res) => {
  const nuevoUsuario = req.body;

  const archivoUsuarios = path.join(__dirname, 'usuarios.json');

  fs.readFile(archivoUsuarios, 'utf8', (err, data) => {
    let usuarios = [];

    if (!err && data) {
      usuarios = JSON.parse(data);
    }

    // Verifica si el email ya existe
    if (usuarios.some(u => u.email === nuevoUsuario.email)) {
      return res.status(400).json({ mensaje: 'Este email ya está registrado' });
    }

    usuarios.push(nuevoUsuario);

    fs.writeFile(archivoUsuarios, JSON.stringify(usuarios, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ mensaje: 'Error al guardar el usuario' });
      }

      res.status(200).json({ mensaje: 'Usuario registrado correctamente' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
