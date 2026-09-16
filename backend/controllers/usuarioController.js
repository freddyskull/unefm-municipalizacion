const bcrypt = require('bcryptjs');
const db = require('../config/sqlite');

const getAll = (req, res) => {
  db.all(
    'SELECT id, username, nombre, email, rol, created_at, estado FROM usuarios ORDER BY id DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Error listando usuarios:', err.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      res.json(rows);
    }
  );
};

const create = (req, res) => {
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
        console.error('Error creando usuario:', err.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      res.status(201).json({ message: 'Usuario creado correctamente' });
    }
  );
};

const update = (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol, password, estado } = req.body;

  let query = 'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, estado = ? WHERE id = ?';
  let params = [nombre, email, rol, estado !== undefined ? estado : 1, id];

  if (password) {
    const hashed = bcrypt.hashSync(password, 10);
    query = 'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, estado = ?, password = ? WHERE id = ?';
    params = [nombre, email, rol, estado !== undefined ? estado : 1, hashed, id];
  }

  db.run(query, params, function (err) {
    if (err) {
      console.error('Error actualizando usuario:', err.message);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario actualizado correctamente' });
  });
};

const remove = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM usuarios WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error eliminando usuario:', err.message);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado correctamente' });
  });
};

module.exports = { getAll, create, update, remove };