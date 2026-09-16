const db = require('../config/database');

const getStats = async (req, res) => {
  try {
    const tablesResult = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = [];
    for (const row of tablesResult.rows) {
      const countResult = await db.query(`SELECT COUNT(*) AS total FROM "${row.table_name}"`);
      tables.push({
        name: row.table_name,
        rows: parseInt(countResult.rows[0].total),
      });
    }

    res.json({
      database: process.env.DB_NAME || 'municipalizacion',
      timestamp: new Date().toISOString(),
      tables,
    });
  } catch (err) {
    console.error('Error obteniendo estadísticas:', err.message);
    res.status(500).json({ error: 'No se pudieron obtener las estadísticas de la base de datos' });
  }
};

const getChartData = async (req, res) => {
  const { table, column } = req.params;

  try {
    const validTables = await db.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `);
    const tableNames = validTables.rows.map(r => r.table_name);

    if (!tableNames.includes(table)) {
      return res.status(400).json({ error: `Tabla '${table}' no existe` });
    }

    const result = await db.query(`
      SELECT "${column}" AS value, COUNT(*) AS total
      FROM "${table}"
      GROUP BY "${column}"
      ORDER BY total DESC
      LIMIT 20
    `);

    res.json({ labels: result.rows.map(r => r.value), values: result.rows.map(r => r.total) });
  } catch (err) {
    console.error(`Error obteniendo datos para gráfico de ${table}.${column}:`, err.message);
    res.status(500).json({ error: 'No se pudieron obtener los datos del gráfico' });
  }
};

module.exports = { getStats, getChartData };