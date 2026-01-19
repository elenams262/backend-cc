const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

// @route   POST api/auth/register
// @desc    Registrar un usuario (Admin o Cliente)
router.post("/register", async (req, res) => {
  const { name, surname, email, password, role, profile } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "El usuario ya existe" });

    user = new User({ name, surname, email, password, role, profile });

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Crear Token
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// @route   POST api/auth/login
// @desc    Autenticar usuario y obtener token
router.post("/login", async (req, res) => {
  console.log("👉 Intento de Login recibido");
  console.log("Body:", req.body);
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      console.log("❌ Usuario no encontrado:", email);
      return res
        .status(400)
        .json({ msg: "Credenciales inválidas (Usuario no existe)" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Contraseña incorrecta para:", email);
      return res
        .status(400)
        .json({ msg: "Credenciales inválidas (Password mal)" });
    }

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        console.log("✅ Login exitoso. Token generado.");
        res.json({
          token,
          role: user.role,
          user: {
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role,
            avatar: user.avatar, // Important for profile picture
          },
        });
      },
    );
  } catch (err) {
    console.error("🔥 Error en el servidor:", err.message);
    res.status(500).send("Error en el servidor");
  }
});

// @route   POST api/auth/claim-account
// @desc    Activar cuenta con código y establecer contraseña
router.post("/claim-account", async (req, res) => {
  const { email, code, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    // Verificar código
    if (!user.inviteCode || user.inviteCode !== code) {
      return res
        .status(400)
        .json({ msg: "Código de invitación inválido o expirado" });
    }

    // Actualizar contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Limpiar código para que no se pueda reusar
    user.inviteCode = null;

    // Opcional: Actualizar status si lo usamos
    if (user.profile) {
      user.profile.status = "Activo";
    }

    await user.save();

    // Auto-login (retornar token)
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          role: user.role,
          user: {
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
          },
        });
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al activar cuenta");
  }
});

// @route   POST api/auth/reset-password
// @desc    Restablecer contraseña usando código de recuperación
router.post("/reset-password", async (req, res) => {
  const { email, code, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    // Verificar código
    if (!user.recoveryCode || user.recoveryCode !== code) {
      return res.status(400).json({ msg: "Código de recuperación inválido" });
    }

    // Actualizar contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Limpiar código
    user.recoveryCode = null;

    await user.save();

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al restablecer contraseña");
  }
});

// @route   GET api/auth/me
// @desc    Obtener usuario autenticado
router.get("/me", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor");
  }
});

module.exports = router;
