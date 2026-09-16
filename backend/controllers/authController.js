const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/sqlite');

const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  db.get(
    'SELECT * FROM usuarios WHERE username = ? AND estado = 1',
    [username],
    (err, user) => {
      if (err) {
        console.error('Error en login:', err.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          rol: user.rol,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
        },
      });
    }
  );
};

const register = (req, res) => {
  const { username, password, nombre, email, rol } = req.body;

  if (!username || !password || !nombre) {
    return res.status(400).json({ error: 'Usuario, contraseña y nombre son requeridos' });
  }

  const hashed = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO usuarios (username, password, nombre, email, rol) VALUES (?, ?, ?, ?, ?)',
    [username, hashed, nombre, email || null, rol || 'usuario'],
    (err) => {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'El nombre de usuario ya existe' });
        }
        console.error('Error en registro:', err.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      res.status(201).json({ message: 'Usuario registrado correctamente' });
    }
  );
};

const getProfile = (req, res) => {
  db.get(
    'SELECT id, username, nombre, email, rol, created_at FROM usuarios WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error('Error obteniendo perfil:', err.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(user);
    }
  );
};

module.exports = { login, register, getProfile };