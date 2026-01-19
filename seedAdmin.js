const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config(); // Para leer tu conexión a Mongo

// Configuración de tu usuario Admin
const adminData = {
  name: "Admin",
  surname: "Calibrado",
  email: "info@calibradocorporal.es",
  password: "adminpassword", // ⚠️ ¡Contraseña por defecto!
  role: "admin",
  profile: {
    limitations: [],
    objectives: ["Administración"],
    status: "Entrenadora",
  },
};

const seedAdmin = async () => {
  try {
    // 1. Conectar a la Base de Datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🌱 Conectado a MongoDB...");

    // 2. Verificar si ya existe para no duplicarlo
    const userExists = await User.findOne({ email: adminData.email });
    if (userExists) {
      console.log("⚠️ El usuario Admin ya existe.");
      process.exit();
    }

    // 3. Crear el usuario
    const user = new User(adminData);

    // 4. Encriptar la contraseña (¡Seguridad ante todo!)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(adminData.password, salt);

    // 5. Guardar en la base de datos
    await user.save();
    console.log("✅ ¡Usuario Admin creado con éxito!");
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Password: ${adminData.password}`);

    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedAdmin();
