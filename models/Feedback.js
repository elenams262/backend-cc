const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  workout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workout",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  rpe: {
    type: Number, // Escala de esfuerzo percibido (1-10)
    required: true,
  },
  comments: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
