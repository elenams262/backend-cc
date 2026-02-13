const mongoose = require("mongoose");

const WorkoutSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true, // Ej: "Fase 1: Adaptación"
  },
  dateAssigned: {
    type: Date,
    default: Date.now,
  },
  // Lista de ejercicios de la rutina
  exercises: [
    {
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
        required: true,
      },
      // Guardamos estos datos específicos para esta rutina
      sets: { type: String, default: "3" },
      reps: { type: String, default: "10-12" },
      rest: { type: String, default: "60s" },
      notes: { type: String, default: "" },
    },
  ],
  status: {
    type: String,
    enum: ["Activo", "Completado", "Archivado"],
    default: "Activo",
  },
  order: {
    type: Number,
    default: 100, // Por defecto al final si no se especifica. Se puede ajustar.
  },
});

module.exports = mongoose.model("Workout", WorkoutSchema);
