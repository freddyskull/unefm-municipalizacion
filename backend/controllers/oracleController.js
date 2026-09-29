const { executeOracle, thickModeAvailable } = require('../config/oracle');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const checkOracle = (res) => {
  if (!thickModeAvailable) {
    return res.status(503).json({ error: 'Oracle Instant Client no disponible', connected: false });
  }
  return null;
};

const getPagination = (req) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  return { limit, offset };
};

const getIdentity = (req) => {
  const qCedula = String(req.query.cedula ?? '').trim();
  const qTipo = String(req.query.tipo ?? '').trim();
  const cedula = qCedula !== '' ? qCedula : (req.user.cedula || '');
  const tipoper = qTipo !== '' ? qTipo : (req.user.tipoper || '');
  return { cedula, tipoper };
};

const getOracleHealth = async (req, res) => {
  const start = Date.now();
  try {
    await executeOracle('SELECT 1 AS OK FROM DUAL');
    res.json({ connected: true, latencyMs: Date.now() - start, client: thickModeAvailable });
  } catch (err) {
    res.json({
      connected: false,
      latencyMs: Date.now() - start,
      client: thickModeAvailable,
      error: err.message || String(err),
    });
  }
};

const getEmpleados = async (req, res) => {
  if (checkOracle(res)) return;
  const cedula = String(req.query.cedula ?? '').trim();
  if (!cedula) {
    return res.status(400).json({ error: 'Parámetro "cedula" requerido' });
  }
  try {
    const empleados = await executeOracle(`
      SELECT CEDEMP, NOMEMP, APEEMP, TIPOPER
      FROM PERSONAL.EMPLEADOS
      WHERE CEDEMP = :cedula
      ORDER BY TIPOPER
    `, [cedula]);
    res.json({ empleados });
  } catch (err) {
    console.error('Error Oracle empleados:', err.message || err);
    res.status(500).json({ error: 'Error al consultar empleados en Oracle' });
  }
};

const execPage = async (sql, countSql, params, limit, offset) => {
  const limitParam = offset + limit;
  const pageSql = `
    SELECT * FROM (
      SELECT tbl.*, ROWNUM AS rn FROM (
        ${sql}
      ) tbl WHERE ROWNUM <= :limitParam
    ) WHERE rn > :offsetParam
  `;
  const binds = { ...params, limitParam, offsetParam: offset };
  const [rows, totalRows] = await Promise.all([
    executeOracle(pageSql, binds),
    executeOracle(countSql, params),
  ]);
  const total = totalRows.length > 0 ? parseInt(totalRows[0].TOTAL ?? totalRows[0].total, 10) : 0;
  return { data: rows, total, limit, offset };
};

const getContratos = async (req, res) => {
  if (checkOracle(res)) return;
  const { limit, offset } = getPagination(req);
  const { cedula, tipoper } = getIdentity(req);

  const search = String(req.query.search ?? '').trim();
  const orderBy = String(req.query.orderBy ?? '').trim();
  const order = String(req.query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const joins = `
      FROM PERSONAL.movimiento a
        LEFT JOIN PERSONAL.tipomovi b ON b.codtipmovi = a.codtipmov
        LEFT JOIN PERSONAL.dedicacion d ON a.coddedmov = d.codded
        LEFT JOIN PERSONAL.condicionper e ON a.codcond = e.codcond
        LEFT JOIN PERSONAL.estadoper f ON a.codest = f.codest
        LEFT JOIN NOMINA.ESTADOS_VENE g ON a.ubigeo = g.CODIGO`;
  const conditions = [
    `a.codtipper = :tipoper`,
    `a.cedempmov = :cedula`,
  ];
  const params = { cedula, tipoper };
  if (search) {
    conditions.push(`(
         UPPER(a.nummov) LIKE UPPER(:search)
      OR UPPER(b.destipmovi) LIKE UPPER(:search)
      OR UPPER(g.NOMBRE) LIKE UPPER(:search)
      OR UPPER(d.desded1) LIKE UPPER(:search)
      OR UPPER(e.descond) LIKE UPPER(:search)
      OR UPPER(f.desest) LIKE UPPER(:search)
      OR to_char(a.fecautpro,'dd/mm/yyyy') LIKE :search
      OR to_char(a.fecautdef,'dd/mm/yyyy') LIKE :search
      OR UPPER(TO_CHAR(a.numhora)) LIKE UPPER(:search)
    )`);
    params.search = `%${search.toUpperCase()}%`;
  }
  const where = conditions.join('\n        AND ');

  const SELECT_COLS = `
      a.nummov AS NOTIFICACION,
      g.NOMBRE AS MUNICIPIO,
      b.destipmovi AS MOVIMIENTO,
      to_char(a.fecautpro,'dd/mm/yyyy') AS FECHAINI,
      decode(to_char(a.fecautdef,'dd/mm/yyyy'), '01/01/1970', null, to_char(a.fecautdef,'dd/mm/yyyy')) AS FECHAFIN,
      CASE WHEN a.codtipper = '01'
        THEN (SELECT DESCAT FROM PERSONAL.CATEGORIA WHERE CODCAT = a.codmacar)
        ELSE (SELECT desmacar FROM PERSONAL.manucargo WHERE codmacar = a.codmacar)
      END AS CARGO,
      CASE WHEN a.codtipper = '01' THEN '-' ELSE
        (SELECT escmacar FROM PERSONAL.manucargo WHERE codmacar = a.codmacar)
      END AS ESCALA,
      CASE WHEN a.codtipper = '01' THEN '-' ELSE
        (SELECT nivmacar FROM PERSONAL.manucargo WHERE codmacar = a.codmacar)
      END AS NIVEL,
      e.descond AS CONDICION,
      d.desded1 AS DEDICACION,
      a.numhora AS HORAS,
      f.desest AS ESTADO,
      (SELECT desdep FROM PERSONAL.dependencia WHERE coddep = a.coddepmov) AS DEPENDENCIA`;

  const ORDER_COLS = {
    NOTIFICACION: 'a.nummov',
    MUNICIPIO: 'g.NOMBRE',
    MOVIMIENTO: 'b.destipmovi',
    FECHAINI: 'a.fecautpro',
    FECHAFIN: 'a.fecautdef',
    CARGO: 'CARGO',
    ESCALA: 'ESCALA',
    NIVEL: 'NIVEL',
    CONDICION: 'e.descond',
    DEDICACION: 'd.desded1',
    HORAS: 'a.numhora',
    ESTADO: 'f.desest',
    DEPENDENCIA: 'DEPENDENCIA',
  };

  try {
    const { data, total } = await execPage(
      `
      SELECT ${SELECT_COLS}
      ${joins}
      WHERE ${where}
      ORDER BY ${ORDER_COLS[orderBy] || 'a.fecautpro'} ${ORDER_COLS[orderBy] ? order : 'ASC'}
    `,
      `
      SELECT COUNT(*) AS TOTAL
      ${joins}
      WHERE ${where}
    `,
      params,
      limit,
      offset
    );
    res.json({ contratos: data, total, limit, offset, page: offset / limit });
  } catch (err) {
    console.error('Error Oracle contratos:', err.message || err);
    res.status(500).json({ error: 'Error al consultar contratos en Oracle' });
  }
};

const getPermisos = async (req, res) => {
  if (checkOracle(res)) return;
  const { limit, offset } = getPagination(req);
  const { cedula } = getIdentity(req);

  const search = String(req.query.search ?? '').trim();
  const orderBy = String(req.query.orderBy ?? '').trim();
  const order = String(req.query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const conditions = [
    `a.CEDPROFPM = :cedula`,
    `b.CODTIPOPM = a.CODTIPPM`,
  ];
  const params = { cedula };
  if (search) {
    conditions.push(`(
       UPPER(b.DESTIPPM) LIKE UPPER(:search)
       OR to_char(a.FECINIPM,'dd/mm/yyyy') LIKE :search
       OR to_char(a.FECCULPM,'dd/mm/yyyy') LIKE :search
       OR UPPER(a.MOTIVOPM) LIKE UPPER(:search)
       OR UPPER(a.NUMFOLIO) LIKE UPPER(:search)
    )`);
    params.search = `%${search.toUpperCase()}%`;
  }
  const where = conditions.join('\n        AND ');

  const SELECT_COLS = `
      a.CODTIPPER AS TIPO_PERSONAL,
      b.DESTIPPM AS TIPO,
      to_char(a.FECINIPM,'dd/mm/yyyy') AS DESDE,
      decode(to_char(a.FECCULPM,'dd/mm/yyyy'), '01/01/1970', null, to_char(a.FECCULPM,'dd/mm/yyyy')) AS HASTA,
      a.MOTIVOPM AS MOTIVO,
      a.NUMFOLIO`;

  const ORDER_COLS = {
    TIPO_PERSONAL: 'a.CODTIPPER',
    TIPO: 'b.DESTIPPM',
    DESDE: 'a.FECINIPM',
    HASTA: 'a.FECCULPM',
    MOTIVO: 'a.MOTIVOPM',
    NUMFOLIO: 'a.NUMFOLIO',
  };

  try {
    const { data, total } = await execPage(
      `
      SELECT ${SELECT_COLS}
      FROM PERSONAL.PERMISOS a, PERSONAL.TIPOPERMISO b
      WHERE ${where}
      ORDER BY ${ORDER_COLS[orderBy] || 'a.FECINIPM'} ${ORDER_COLS[orderBy] ? order : 'DESC'}
    `,
      `
      SELECT COUNT(*) AS TOTAL
      FROM PERSONAL.PERMISOS a, PERSONAL.TIPOPERMISO b
      WHERE ${where}
    `,
      params,
      limit,
      offset
    );
    res.json({ permisos: data, total, limit, offset, page: offset / limit });
  } catch (err) {
    console.error('Error Oracle permisos:', err.message || err);
    res.status(500).json({ error: 'Error al consultar permisos en Oracle' });
  }
};

const getNominasEfectivas = async (req, res) => {
  if (checkOracle(res)) return;
  const { limit, offset } = getPagination(req);
  const { cedula, tipoper } = getIdentity(req);

  const search = String(req.query.search ?? '').trim();
  const fechaDesde = String(req.query.fechaDesde ?? '').trim();
  const fechaHasta = String(req.query.fechaHasta ?? '').trim();
  const orderBy = String(req.query.orderBy ?? '').trim();
  const order = String(req.query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const conditions = [
    `a.CEDEMP = :cedula`,
    `a.CODTIPNOM IN (SELECT CODTIPNOM FROM NOMINA.TIPONOMINA WHERE CODTIPPER = :tipoper)`,
    `a.CODNOM IN (SELECT CODNOM FROM NOMINA.NOMINA WHERE SITUACION = '0' AND CODTIPNOM IN (SELECT CODTIPNOM FROM NOMINA.TIPONOMINA WHERE CODTIPPER = :tipoper))`,
    `a.CODNOM = c.CODNOM`,
    `a.CODTIPNOM = c.CODTIPNOM`,
    `a.CODBANEMP = b.CODIGO`,
    `a.CODTIPNOM = d.CODTIPNOM`,
    `a.CODNOM NOT LIKE 'P%'`,
    `a.CODNOM NOT LIKE 'B%'`,
    `a.CODNOM NOT LIKE 'H%'`,
  ];
  const params = { cedula, tipoper };
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaDesde) && /^\d{4}-\d{2}-\d{2}$/.test(fechaHasta)) {
    conditions.push(
      `TRUNC(c.FECHAINI) >= TO_DATE(:fechaDesde, 'YYYY-MM-DD')`,
      `TRUNC(c.FECHAINI) <= TO_DATE(:fechaHasta, 'YYYY-MM-DD')`
    );
    params.fechaDesde = fechaDesde;
    params.fechaHasta = fechaHasta;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaDesde)) {
    conditions.push(`TRUNC(c.FECHAINI) >= TO_DATE(:fechaDesde, 'YYYY-MM-DD')`);
    params.fechaDesde = fechaDesde;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaHasta)) {
    conditions.push(`TRUNC(c.FECHAINI) <= TO_DATE(:fechaHasta, 'YYYY-MM-DD')`);
    params.fechaHasta = fechaHasta;
  }
  if (search) {
    conditions.push(`(
         a.CODNOM LIKE :search
      OR a.NUMCTABAN LIKE :search
      OR b.DESCRIP LIKE :search
      OR c.DESNOM LIKE :search
      OR d.DESTIPNOM LIKE :search
      OR to_char(c.FECHAINI,'dd/mm/yyyy') LIKE :search
    )`);
    params.search = `%${search.toUpperCase()}%`;
  }
  const where = conditions.join('\n        AND ');

  const ORDER_COLS = {
    CODNOM: 'a.CODNOM',
    NUMCTABAN: 'a.NUMCTABAN',
    BANCO: 'b.DESCRIP',
    FECHANOMINA: 'c.FECHAINI',
    DESNOM: 'c.DESNOM',
    DESTIPNOM: 'd.DESTIPNOM',
  };
  const col = ORDER_COLS[orderBy] || 'c.FECHAINI';
  const dir = ORDER_COLS[orderBy] ? order : 'DESC';

  try {
    const { data, total } = await execPage(
      `
      SELECT a.CODNOM, a.NUMCTABAN as CUENTA, b.DESCRIP as BANCO,
             to_char(c.FECHAINI,'dd/mm/yyyy') as FECHANOMINA,
             c.DESNOM, d.DESTIPNOM
      FROM NOMINA.SITUAEMPNOM a, NOMINA.TIPOBANCO b, NOMINA.NOMINA c, NOMINA.TIPONOMINA d
      WHERE ${where}
      ORDER BY ${col} ${dir}
    `,
      `
      SELECT COUNT(*) AS TOTAL
      FROM NOMINA.SITUAEMPNOM a, NOMINA.TIPOBANCO b, NOMINA.NOMINA c, NOMINA.TIPONOMINA d
      WHERE ${where}
    `,
      params,
      limit,
      offset
    );
    res.json({ nominas: data, total, limit, offset, page: offset / limit });
  } catch (err) {
    console.error('Error Oracle nominas efectivas:', err.message || err);
    res.status(500).json({ error: 'Error al consultar nóminas efectivas en Oracle' });
  }
};

const getInfoTrabajador = async (req, res) => {
  if (checkOracle(res)) return;
  const { cedula } = getIdentity(req);
  try {
    const rows = await executeOracle(`
      SELECT a.CEDEMP, a.NOMEMP, a.APEEMP, a.SEXOEMP, a.FECNACEMP,
             COALESCE(cat.DESCAT, mc.DESCORTAMA, 'No disponible') as DES_CAR,
             dep.DESDEP,
             COALESCE(
               (SELECT MIN(m.FECAUTPRO) FROM PERSONAL.MOVIMIENTO m WHERE m.CEDEMPMOV = a.CEDEMP AND m.CODTIPMOV = '01'),
               (SELECT MIN(fecha) FROM NOMINA.SUELDOPRESTACION WHERE CEDEMP = a.CEDEMP),
               (SELECT MIN(m.FECAUTPRO) FROM PERSONAL.MOVIMIENTO m WHERE m.CEDEMPMOV = a.CEDEMP AND m.CODTIPMOV IN ('02','03','21','24'))
             ) as FECING,
             (SELECT e.DESEST
                FROM (SELECT m2.CEDEMPMOV, m2.CODEST,
                             ROW_NUMBER() OVER (PARTITION BY m2.CEDEMPMOV
                                                ORDER BY m2.FECAUTPRO DESC NULLS LAST, m2.FECMOV DESC NULLS LAST) rn
                      FROM PERSONAL.MOVIMIENTO m2) ult
                LEFT JOIN PERSONAL.estadoper e ON e.CODEST = ult.CODEST
                WHERE ult.CEDEMPMOV = a.CEDEMP AND ult.rn = 1) as ESTATUS
      FROM PERSONAL.EMPLEADOS a
        LEFT JOIN NOMINA.SITUAEMPNOM b ON a.CEDEMP = b.CEDEMP AND b.CODNOM = '-'
        LEFT JOIN PERSONAL.CATEGORIA cat ON b.CARGCAT = cat.CODCAT AND a.TIPOPER = '01'
        LEFT JOIN PERSONAL.MANUCARGO mc ON b.CARGCAT = mc.CODMACAR AND a.TIPOPER IN ('02','03')
        LEFT JOIN PERSONAL.DEPENDENCIA dep ON a.CODDEP = dep.CODDEP
      WHERE a.CEDEMP = :cedula
    `, [cedula]);
    res.json({ trabajador: rows.length > 0 ? rows[0] : null });
  } catch (err) {
    console.error('Error Oracle info trabajador:', err.message || err);
    res.status(500).json({ error: 'Error al consultar información del trabajador en Oracle' });
  }
};

const getCargaFamiliar = async (req, res) => {
  if (checkOracle(res)) return;
  const { cedula } = getIdentity(req);
  try {
    const familiares = await executeOracle(`
      SELECT NOMFAM, APEFAM, PARENFAM as PAREN, to_char(FECFAM,'dd/mm/yyyy') as FECNAC
      FROM PERSONAL.CARGAFAMILIAR
      WHERE CEDPROFFAM = :cedula
      ORDER BY FECFAM
    `, [cedula]);
    res.json({ familiares });
  } catch (err) {
    console.error('Error Oracle carga familiar:', err.message || err);
    res.status(500).json({ error: 'Error al consultar carga familiar en Oracle' });
  }
};

const getMeses = async (req, res) => {
  if (checkOracle(res)) return;
  try {
    const meses = await executeOracle(`
      SELECT MES, DMES, ANO FROM NOMINA.CONST_M_A ORDER BY ANO DESC, MES DESC
    `);
    res.json({ meses });
  } catch (err) {
    console.error('Error Oracle meses:', err.message || err);
    res.status(500).json({ error: 'Error al consultar meses de nómina en Oracle' });
  }
};

const getNominasPago = async (req, res) => {
  if (checkOracle(res)) return;
  const { mes } = req.query;
  if (!mes) {
    return res.status(400).json({ error: 'Parámetro "mes" requerido' });
  }
  const { limit, offset } = getPagination(req);
  const { cedula } = getIdentity(req);

  const search = String(req.query.search ?? '').trim();
  const orderBy = String(req.query.orderBy ?? '').trim();
  const order = String(req.query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  try {
    const anio = await executeOracle(
      `SELECT ANO FROM NOMINA.CONST_M_A WHERE MES = :mes`, [mes]
    );
    const year = anio.length > 0 ? anio[0].ANO : new Date().getFullYear();

    const conditions = [
      `a.CEDEMP = :cedula`,
      `a.CODCON = b.CODCON`,
      `a.CODTIPNOM = c.CODTIPNOM`,
      `a.CODNOM = c.CODNOM`,
      `c.SITUACION = '0'`,
      `a.CODNOM NOT LIKE 'P%'`,
      `to_char(c.FECHAINI,'mm') = :mes`,
      `to_char(c.FECHAINI,'yyyy') = :anio`,
      `a.CEDEMP = e.CEDEMP`
    ];
    const params = { cedula, mes, anio: year };
    if (search) {
      conditions.push(`(
           a.CODCON LIKE :search
        OR b.DESCORTA LIKE :search
        OR b.CODTIPCON LIKE :search
      )`);
      params.search = `%${search.toUpperCase()}%`;
    }
    const where = conditions.join('\n        AND ');

    const ORDER_COLS = {
      CODCON: 'a.CODCON',
      DESCORTA: 'b.DESCORTA',
      CODTIPCON: 'b.CODTIPCON',
      MONTO: 'a.MONTO',
      CUOTA: 'a.CUOTA',
    };
    const orderPart = orderBy
      ? `ORDER BY ${ORDER_COLS[orderBy] || 'a.CODCON'} ${ORDER_COLS[orderBy] ? order : 'ASC'}`
      : `ORDER BY b.CODTIPCON DESC, a.CODCON`;

    const { data, total } = await execPage(
      `
      SELECT a.CODCON, b.DESCORTA, b.CODTIPCON, a.MONTO, a.CUOTA,
             e.CEDEMP, e.APEEMP, e.NOMEMP
      FROM NOMINA.DETALLENOM a, NOMINA.CONCEPTOS b, NOMINA.NOMINA c,
           PERSONAL.EMPLEADOS e
      WHERE ${where}
      ${orderPart}
    `,
      `
      SELECT COUNT(*) AS TOTAL
      FROM NOMINA.DETALLENOM a, NOMINA.CONCEPTOS b, NOMINA.NOMINA c,
           PERSONAL.EMPLEADOS e
      WHERE ${where}
    `,
      params,
      limit,
      offset
    );

    const netoRows = await executeOracle(
      `
      SELECT SUM(DECODE(b.CODTIPCON, '1', a.MONTO, -a.MONTO)) AS NETO,
             SUM(DECODE(b.CODTIPCON, '1', a.MONTO, 0)) AS ASIGNACIONES,
             SUM(DECODE(b.CODTIPCON, '1', 0, a.MONTO)) AS DEDUCCIONES
      FROM NOMINA.DETALLENOM a, NOMINA.CONCEPTOS b, NOMINA.NOMINA c,
           PERSONAL.EMPLEADOS e
      WHERE ${where}
    `,
      params
    );
    const neto = netoRows.length > 0 && netoRows[0].NETO != null ? Number(netoRows[0].NETO) : 0;
    const asignaciones = netoRows.length > 0 && netoRows[0].ASIGNACIONES != null ? Number(netoRows[0].ASIGNACIONES) : 0;
    const deducciones = netoRows.length > 0 && netoRows[0].DEDUCCIONES != null ? Number(netoRows[0].DEDUCCIONES) : 0;

    res.json({ nominas: data, total, neto, asignaciones, deducciones, limit, offset, page: offset / limit });
  } catch (err) {
    console.error('Error Oracle nominas pago:', err.message || err);
    res.status(500).json({ error: 'Error al consultar nóminas de pago en Oracle' });
  }
};

module.exports = {
  getContratos,
  getPermisos,
  getNominasEfectivas,
  getInfoTrabajador,
  getCargaFamiliar,
  getMeses,
  getNominasPago,
  getEmpleados,
  getOracleHealth,
};