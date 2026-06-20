const multer = require('multer');

// ────────────────────────────────────────────────────────────────
// Almacenamiento en memoria (no escribe a disco directamente).
// Esto evita conflictos con OneDrive/antivirus que bloquean el
// archivo justo cuando multer intenta escribirlo en disco mientras
// aún está llegando por la red (causaba ENOENT intermitente).
// El guardado real a disco se hace en el controlador, una vez el
// archivo ya está completo en memoria.
// ────────────────────────────────────────────────────────────────
const storage = multer.memoryStorage();

// ────────────────────────────────────────────────────────────────
// Validación de archivos
// ────────────────────────────────────────────────────────────────
const path = require('path');

const fileFilter = (req, file, cb) => {

  const permitidos = /jpeg|jpg|png|webp/;

  const extensionValida = permitidos.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimeValido = permitidos.test(file.mimetype);

  const esValido = extensionValida && mimeValido;

  if (esValido) {
    cb(null, true);
  } else {
    cb(
      new Error('Solo se permiten imágenes jpg, png o webp')
    );
  }

};

// ────────────────────────────────────────────────────────────────
// Exportar configuración de multer
// ────────────────────────────────────────────────────────────────
module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB por archivo
});