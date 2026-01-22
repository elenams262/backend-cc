const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "client"], default: "client" },
  // Información para comprender a la persona en su conjunto [cite: 6]
  profile: {
    limitations: [String], // Dolores o compensaciones detectadas [cite: 4]
    objectives: [String], // Metas de la persona
    status: { type: String, default: "Baja forma / Limitación" },
  },
  inviteCode: { type: String }, // Código para completar registro
  recoveryCode: { type: String }, // Código para recuperar contraseña
  avatar: { type: String }, // URL de la foto de perfil
  phone: { type: String }, // Teléfono de contacto
});

module.exports = mongoose.model("User", UserSchema);
