const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // Ej: "Fuerza Básica A"
  },
  description: {
    type: String, // Ej: "Rutina fullbody para principiantes"
    default: "",
  },
  exercises: [
    {
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
        required: true,
      },
      sets: { type: String, default: "3" },
      reps: { type: String, default: "10-12" },
      rest: { type: String, default: "60s" },
      notes: { type: String, default: "" },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Template", TemplateSchema);
