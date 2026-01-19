const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Evaluation = require("../models/Evaluation");
const Exercise = require("../models/Exercise");
const Workout = require("../models/Workout");
const Feedback = require("../models/Feedback");
const Note = require("../models/Note");
const Template = require("../models/Template");
const auth = require("../middleware/auth"); // El middleware que revisa el token
const bcrypt = require("bcryptjs");

// Middleware para verificar si es ADMIN
const verifyAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ msg: "Acceso denegado. Se requiere rol de Admin." });
    }
    next();
  } catch (err) {
    res.status(500).send("Error del servidor verificando rol");
  }
};

// @route   GET api/admin/users
// @desc    Obtener todos los usuarios que son CLIENTES (Calibrantes)
// @access  Privado (Solo Admin)
router.get("/users", async (req, res) => {
  try {
    // Buscamos usuarios cuyo rol sea 'client'. Excluimos la contraseña por seguridad.
    const users = await User.find({ role: "client" })
      .select("-password")
      .sort({ date: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor al obtener usuarios");
  }
});
// @route   POST api/admin/users
// @desc    Crear un nuevo usuario (Calibrante) con código de invitación
router.post("/users", async (req, res) => {
  try {
    const { name, surname, email, profile } = req.body;

    // Verificar si existe
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ msg: "El usuario ya existe con este email" });
    }

    // Generar código de invitación (6 caracteres alfanuméricos)
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Contraseña temporal aleatoria (el usuario la cambiará al activar)
    const tempPassword = Math.random().toString(36).slice(-10);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    user = new User({
      name,
      surname,
      email,
      password: hashedPassword,
      role: "client",
      profile,
      inviteCode,
    });

    await user.save();

    res.json({ user, inviteCode });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al crear usuario");
  }
});

// @route   GET api/admin/users/:id
// @desc    Obtener un usuario por ID (Ver Ficha)
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    res.status(500).send("Error en el servidor");
  }
});

// @route   POST api/admin/evaluations
// @desc    Crear una nueva evaluación (Lectura Corporal)
router.post("/evaluations", async (req, res) => {
  try {
    const { clientId, type, priorityZones, focus, notes } = req.body;

    // Crear la evaluación
    const newEval = new Evaluation({
      client: clientId,
      type,
      priorityZones,
      focus,
      notes,
    });

    const savedEval = await newEval.save();
    res.json(savedEval);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al guardar la evaluación");
  }
});

// @route   GET api/admin/evaluations/:clientId
// @desc    Obtener historial de evaluaciones de un cliente
router.get("/evaluations/:clientId", async (req, res) => {
  try {
    const evals = await Evaluation.find({ client: req.params.clientId }).sort({
      date: -1,
    });
    res.json(evals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener historial");
  }
});

// @route   POST api/admin/exercises
// @desc    Crear un nuevo ejercicio
router.post("/exercises", async (req, res) => {
  try {
    const newExercise = new Exercise(req.body);
    const exercise = await newExercise.save();
    res.json(exercise);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al crear ejercicio");
  }
});

// @route   GET api/admin/exercises
// @desc    Obtener todos los ejercicios
router.get("/exercises", async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ name: 1 });
    res.json(exercises);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener ejercicios");
  }
});

// @route   DELETE api/admin/exercises/:id
// @desc    Eliminar un ejercicio
router.delete("/exercises/:id", async (req, res) => {
  try {
    await Exercise.findByIdAndDelete(req.params.id);
    res.json({ msg: "Ejercicio eliminado" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al eliminar ejercicio");
  }
});

// @route   POST api/admin/workouts
// @desc    Asignar una nueva rutina a un cliente
router.post("/workouts", async (req, res) => {
  try {
    const { clientId, title, exercises } = req.body;

    // exercises debe ser un array de objetos { exercise: ID, sets, reps, ... }
    const newWorkout = new Workout({
      client: clientId,
      title,
      exercises,
    });

    const savedWorkout = await newWorkout.save();
    res.json(savedWorkout);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al guardar la rutina");
  }
});

// @route   GET api/admin/workouts/client/:clientId
// @desc    Obtener rutinas de un cliente
router.get("/workouts/client/:clientId", async (req, res) => {
  try {
    const workouts = await Workout.find({ client: req.params.clientId })
      .populate("exercises.exercise") // Esto rellena los datos del ejercicio (nombre, video...)
      .sort({ dateAssigned: -1 });
    res.json(workouts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener rutinas");
  }
});

// @route   GET api/admin/feedback/:clientId
// @desc    Obtener historial de entrenamientos completados por el cliente
router.get("/feedback/:clientId", async (req, res) => {
  try {
    const feedback = await Feedback.find({ client: req.params.clientId })
      .populate("workout", "title")
      .sort({ date: -1 });
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener feedback");
  }
});

// @route   POST api/admin/notes
// @desc    Crear una nota interna
router.post("/notes", async (req, res) => {
  try {
    const { clientId, content } = req.body;
    const newNote = new Note({ client: clientId, content });
    await newNote.save();
    res.json(newNote);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al guardar nota");
  }
});

// @route   GET api/admin/notes/:clientId
// @desc    Obtener notas de un cliente
router.get("/notes/:clientId", async (req, res) => {
  try {
    const notes = await Note.find({ client: req.params.clientId }).sort({
      date: -1,
    });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener notas");
  }
});

// @route   POST api/admin/templates
// @desc    Crear una nueva plantilla de rutina
router.post("/templates", async (req, res) => {
  try {
    const { title, description, exercises } = req.body;
    const newTemplate = new Template({ title, description, exercises });
    await newTemplate.save();
    res.json(newTemplate);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al crear plantilla");
  }
});

// @route   GET api/admin/templates
// @desc    Obtener todas las plantillas
router.get("/templates", async (req, res) => {
  try {
    const templates = await Template.find()
      .sort({ title: 1 })
      .populate("exercises.exercise");
    res.json(templates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener plantillas");
  }
});
// @route   DELETE /api/admin/templates/:id
// @desc    Eliminar una plantilla
router.delete("/templates/:id", async (req, res) => {
  try {
    await Template.findByIdAndDelete(req.params.id);
    res.json({ msg: "Plantilla eliminada" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al eliminar plantilla");
  }
});

// @route   PUT /api/admin/templates/:id
// @desc    Editar una plantilla
router.put("/templates/:id", async (req, res) => {
  try {
    const { title, description, exercises } = req.body;
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { title, description, exercises },
      { new: true },
    );
    res.json(template);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al editar plantilla");
  }
});

// @route   POST api/admin/workouts/from-template
// @desc    Asignar rutina desde plantilla a un cliente
router.post("/workouts/from-template", async (req, res) => {
  try {
    const { clientId, templateId } = req.body;

    // 1. Buscamos la plantilla
    const template = await Template.findById(templateId);
    if (!template)
      return res.status(404).json({ msg: "Plantilla no encontrada" });

    // 2. Creamos un nuevo Workout copiando los datos de la plantilla
    const newWorkout = new Workout({
      client: clientId,
      title: template.title, // Heredamos el título (el admin puede editarlo luego si quiere, pero de momento copy-paste)
      exercises: template.exercises, // Copiamos tal cual los ejercicios y sus series/repes base
    });

    await newWorkout.save();
    res.json(newWorkout);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al asignar plantilla");
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Eliminar un usuario (y sus datos relacionados por limpieza básica)
router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    // Idealmente aquí borraríamos en cascada (Workouts, Notes, etc),
    // pero por ahora borramos al usuario para que no pueda entrar.
    res.json({ msg: "Usuario eliminado" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al eliminar usuario");
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Editar datos de un usuario
router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, phone, objective, injuries, notes } = req.body;
    // Buscamos y actualizamos. {new: true} devuelve el objeto actualizado.
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, objective, injuries, notes },
      { new: true },
    ).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al actualizar usuario");
  }
});

// @route   DELETE /api/admin/workouts/:id
// @desc    Eliminar una rutina
router.delete("/workouts/:id", async (req, res) => {
  try {
    await Workout.findByIdAndDelete(req.params.id);
    res.json({ msg: "Rutina eliminada" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al eliminar rutina");
  }
});

// @route   DELETE /api/admin/notes/:id
// @desc    Eliminar una nota
router.delete("/notes/:id", async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ msg: "Nota eliminada" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al eliminar nota");
  }
});

// @route   PUT /api/admin/notes/:id
// @desc    Editar una nota
router.put("/notes/:id", async (req, res) => {
  try {
    const { content } = req.body;
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true },
    );
    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al editar nota");
  }
});

// @route   POST api/admin/users/:id/recovery-code
// @desc    Generar un código de recuperación de contraseña para un usuario
router.post("/users/:id/recovery-code", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Generar código de 6 caracteres
    const recoveryCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    user.recoveryCode = recoveryCode;
    await user.save();

    res.json({ recoveryCode });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al generar código de recuperación");
  }
});

// Configuración de Multer para Admin (Podríamos refactorizar en un util, pero por rapidez duplicamos config)
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, req.user.id + "-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Solo imágenes"));
  },
});

// @route   POST api/admin/avatar
router.post("/avatar", auth(), upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "Falta archivo" });

    // Necesitamos que Admin sea un User o tener un modelo Admin separado?
    // Usamos el modelo User ya que role='admin'

    const avatarUrl = `uploads/${req.file.filename}`;
    const user = await User.findById(req.user.id);
    user.avatar = avatarUrl;
    await user.save();

    res.json({ msg: "Foto actualizada", avatar: avatarUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al subir");
  }
});

// @route   GET api/admin/stats
// @desc    Obtener estadísticas globales para el Dashboard
router.get("/stats", async (req, res) => {
  try {
    const totalClients = await User.countDocuments({ role: "client" });
    const totalExercises = await Exercise.countDocuments();
    const activeWorkouts = await Workout.countDocuments(); // Rutinas asignadas totales

    // Feedback recibido en la última semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentFeedback = await Feedback.countDocuments({
      date: { $gte: oneWeekAgo },
    });

    res.json({
      totalClients,
      totalExercises,
      activeWorkouts,
      recentFeedback,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener estadísticas");
  }
});

// @route   GET api/admin/stats/activity
// @desc    Obtener actividad reciente (feedback, usuarios nuevos, etc)
router.get("/stats/activity", async (req, res) => {
  try {
    // Últimos 10 feedbacks recibidos
    const recentFeedbacks = await Feedback.find()
      .sort({ date: -1 })
      .limit(10)
      .populate("client", "name surname avatar")
      .populate("workout", "title");

    // Calcular tendencia RPE (últimos 10 feedbacks cronológicos)
    const rpeTrend = await Feedback.find()
      .sort({ date: -1 }) // Los más recientes primero
      .limit(10) // Tomamos 10
      .select("rpe date"); // Solo RPE y fecha

    // Reordenamos para que la gráfica vaya de izquierda (antiguo) a derecha (nuevo)
    // Nota: Mongoose devuelve docs, pero reverse() funciona en arrays JS.
    rpeTrend.reverse();

    res.json({ recentFeedbacks, rpeTrend });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener actividad");
  }
});

module.exports = router;
