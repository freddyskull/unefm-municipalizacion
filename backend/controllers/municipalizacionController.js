const db = require('../config/database');

const getTables = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    res.json({ tables: result.rows });
  } catch (err) {
    console.error('Error obteniendo tablas:', err.message);
    res.status(500).json({ error: 'No se pudo conectar a la base de datos municipalizacion' });
  }
};

const getTableData = async (req, res) => {
  const { table } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;
  const search = String(req.query.search ?? '').trim();
  const orderBy = String(req.query.orderBy ?? '').trim();
  const order = String(req.query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  try {
    const validTables = await db.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `);
    const tableNames = validTables.rows.map(r => r.table_name);

    if (!tableNames.includes(table)) {
      return res.status(400).json({ error: `Tabla '${table}' no existe o no es accesible` });
    }

    const cols = await db.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `, [table]);
    const columns = cols.rows.map(r => r.column_name);

    const conditions = [];
    const params = [];
    if (search) {
      conditions.push(`(${table}::text) ILIKE $1`);
      params.push(`%${search}%`);
    }
    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = columns.includes(orderBy)
      ? ` ORDER BY "${orderBy}" ${order}`
      : '';

    const result = await db.query(
      `SELECT * FROM "${table}"${where}${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const countResult = await db.query(`SELECT COUNT(*) FROM "${table}"${where}`, params);

    res.json({
      table,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    });
  } catch (err) {
    console.error(`Error leyendo tabla ${table}:`, err.message);
    res.status(500).json({ error: `No se pudo leer la tabla ${table}` });
  }
};

module.exports = { getTables, getTableData };