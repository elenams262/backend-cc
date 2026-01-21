const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// 1. Configuración de Cloudinary
// (Solo si las variables existen, si no, se usará almacenamiento local)
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log(
    "✅ Cloudinary configurado correctamente. Las imágenes se guardarán en la nube.",
  );
} else {
  console.log(
    "⚠️ Credenciales de Cloudinary no encontradas. Usando almacenamiento local (las imágenes pueden perderse al reiniciar).",
  );
}

let storage;

if (isCloudinaryConfigured) {
  // --- ESTRATEGIA: CLOUDINARY ---
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "calibrado-corporal", // Nombre de la carpeta en Cloudinary
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      // transformation: [{ width: 1000, crop: "limit" }] // Opcional: optimización automática
    },
  });
} else {
  // --- ESTRATEGIA: LOCAL DISK ---
  // Asegurar que exista la carpeta uploads
  const uploadDir = "uploads";
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      // Generar nombre único: timestamp-random.ext
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite 10MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Solo se permiten archivos de imagen válidos (jpeg, jpg, png, webp)",
      ),
    );
  },
});

module.exports = { upload, isCloudinaryConfigured };
