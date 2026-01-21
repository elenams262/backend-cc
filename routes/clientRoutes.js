const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Workout = require("../models/Workout");
const Feedback = require("../models/Feedback");

// @route   GET api/client/workouts
// @desc    Obtener MIS rutinas asignadas
// @access  Private (Cualquier usuario logueado)
// @access  Private (Cualquier usuario logueado)
router.get("/workouts", auth(), async (req, res) => {
  try {
    // Buscamos rutinas donde el 'client' coincida con el ID del usuario logueado (req.user.id)
    const workouts = await Workout.find({ client: req.user.id })
      .populate("exercises.exercise") // Rellenar info de los ejercicios (nombre, video...)
      .sort({ dateAssigned: -1 });

    res.json(workouts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// @route   POST api/client/feedback
// @desc    Guardar feedback de un entrenamiento
// @access  Private
router.post("/feedback", auth(), async (req, res) => {
  try {
    const { workoutId, rpe, comments } = req.body;

    const newFeedback = new Feedback({
      client: req.user.id,
      workout: workoutId,
      rpe,
      comments,
    });

    await newFeedback.save();
    res.json(newFeedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al guardar feedback");
  }
});

// @route   GET api/client/feedback
// @desc    Obtener historial de feedback del usuario logueado
router.get("/feedback", auth(), async (req, res) => {
  try {
    const feedback = await Feedback.find({ client: req.user.id })
      .populate("workout", "title")
      .sort({ date: -1 });
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener historial");
  }
});

// Configuración de Multer para subir imágenes
// Configuración de almacenamiento (Cloudinary o Local)
const { upload, isCloudinaryConfigured } = require("../config/storage");

// @route   POST api/client/avatar
// @desc    Subir foto de perfil
router.post("/avatar", auth(), upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No se subió ningún archivo" });
    }

    // Guardar ruta en la BD
    // Si es Cloudinary, path es URL completa. Si es local, relative.
    const avatarUrl = isCloudinaryConfigured
      ? req.file.path
      : `uploads/${req.file.filename}`;

    // Necesitamos el modelo User aquí. Si no está importado, fallará.
    // Viendo el archivo, User NO está importado. Hay que importarlo arriba o usar mongoose.model
    const User = require("../models/User");

    const user = await User.findById(req.user.id);
    user.avatar = avatarUrl;
    await user.save();

    res.json({ msg: "Foto actualizada", avatar: avatarUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message || "Error al subir imagen");
  }
});

module.exports = router;
