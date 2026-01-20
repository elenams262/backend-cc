const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: [
      "Movilidad",
      "Fuerza",
      "Respiración",
      "Activación",
      "Estiramiento",
      "Cardio",
    ],
    default: "Movilidad",
  },
  videoUrl: {
    type: String, // Link a YouTube/Vimeo
  },
  instructions: {
    type: String,
  },
  tags: [String], // Para búsquedas (ej: "hombro", "goma", "suelo")
  image: {
    type: String, // Ruta de la imagen subida (opcional)
  },
});

module.exports = mongoose.model("Exercise", ExerciseSchema);
