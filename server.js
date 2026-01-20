const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://frontend-cc.vercel.app",
      "https://calibradocorporal.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());
// Servir carpeta uploads de forma estática
app.use("/uploads", express.static("uploads"));
// Ruta de prueba
app.get("/", (req, res) => {
  res.send({
    mensaje: "¡Conexión Backend-Frontend exitosa del Progreso Constante!",
  });
});
// Conexión a DB con el espíritu de "Progreso Constante" [cite: 17]
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado a Calibrado Corporal DB"))
  .catch((err) => console.error("Error de conexión:", err));

// Rutas (las crearemos a continuación)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/client", require("./routes/clientRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
