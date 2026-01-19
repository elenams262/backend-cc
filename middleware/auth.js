const jwt = require("jsonwebtoken");

module.exports = (role) => {
  return (req, res, next) => {
    const token = req.header("x-auth-token");
    if (!token)
      return res.status(401).json({ msg: "No hay token, permiso denegado" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ajustamos aquí: extraemos los datos de la propiedad 'user'
      req.user = decoded.user;

      // Ahora req.user.role sí tendrá el valor "admin" o "client"
      if (role && req.user.role !== role) {
        return res.status(403).json({
          msg: "Acceso denegado: No tienes permisos de administrador",
        });
      }
      next();
    } catch (err) {
      res.status(401).json({ msg: "Token no válido" });
    }
  };
};
