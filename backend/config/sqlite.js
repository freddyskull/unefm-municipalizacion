const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.SQLITE_DB_PATH
  ? path.resolve(__dirname, '..', process.env.SQLITE_DB_PATH)
  : path.join(__dirname, '..', 'data', 'auth.db');
const db = new sqlite3.Database(dbPath);

const createDefaultAdmin = () => {
  const adminUser = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@unefm.edu.ve';
  const hashed = bcrypt.hashSync(adminPassword, 10);

  db.get('SELECT id FROM usuarios WHERE username = ?', [adminUser], (err, row) => {
    if (err) {
      console.error('Error verificando admin:', err.message);
      return;
    }
    if (!row) {
      db.run(
        'INSERT INTO usuarios (username, password, nombre, email, rol) VALUES (?, ?, ?, ?, ?)',
        [adminUser, hashed, 'Administrador', adminEmail, 'admin'],
        (err) => {
          if (err) console.error('Error creando admin:', err.message);
          else console.log(`Usuario ${adminUser} creado (${adminPassword})`);
        }
      );
    }
  });
};

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT,
      rol TEXT DEFAULT 'usuario',
      cedula TEXT,
      tipoper TEXT DEFAULT '01',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      estado INTEGER DEFAULT 1
    )
  `);

  db.run(`ALTER TABLE usuarios ADD COLUMN cedula TEXT`, (err) => {});
  db.run(`ALTER TABLE usuarios ADD COLUMN tipoper TEXT DEFAULT '01'`, (err) => {});

  createDefaultAdmin();
});

module.exports = db;