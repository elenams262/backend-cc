const mongoose = require("mongoose");

const EvaluationSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["Inicial", "Re-evaluación", "Seguimiento"],
    default: "Seguimiento",
  },
  // Decisión de Programación
  priorityZones: {
    type: [String], // Ej: ["Cadera", "Rodilla"]
    enum: [
      "Hombro",
      "Raquis",
      "Cadera",
      "Rodilla",
      "Tobillo",
      "Core",
      "Pie",
      "Codo",
      "Muñeca",
    ],
  },
  focus: {
    type: String, // Ej: "Fuerza máxima"
    enum: [
      "Fuerza máxima",
      "Hipertrofia",
      "Movilidad",
      "Control motor",
      "Integración",
      "Rendimiento",
      "Readaptación",
    ],
  },
  notes: {
    type: String, // "No aumentar carga hasta..."
  },
  // Enlace al archivo (PDF/Excel) si existiera en un futuro
  fileUrl: {
    type: String,
  },
});

module.exports = mongoose.model("Evaluation", EvaluationSchema);
