let oracledb = null;
let thickModeAvailable = false;

try {
  oracledb = require('oracledb');
  try {
    oracledb.initOracleClient();
    thickModeAvailable = true;
    console.log('Oracle Instant Client (Thick Mode) disponible');
    console.log('  -> version cliente:', oracledb.oracleClientVersionString);
  } catch (initErr) {
    console.log('Oracle Instant Client no disponible:', initErr.message.split('\n')[0]);
  }
} catch {
  console.log('Módulo oracledb no instalado');
}

const ORACLE_CONFIG = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT,
};

const executeOracle = async (sql, params = []) => {
  if (!oracledb || !thickModeAvailable) {
    throw { status: 503, message: 'Oracle Instant Client no disponible' };
  }
  let connection;
  try {
    connection = await oracledb.getConnection(ORACLE_CONFIG);
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return result.rows;
  } finally {
    if (connection) await connection.close();
  }
};

module.exports = { oracledb, executeOracle, thickModeAvailable };