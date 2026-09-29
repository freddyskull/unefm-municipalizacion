const express = require('express');
const router = express.Router();
const {
  getContratos,
  getPermisos,
  getNominasEfectivas,
  getInfoTrabajador,
  getCargaFamiliar,
  getMeses,
  getNominasPago,
  getEmpleados,
  getOracleHealth,
} = require('../controllers/oracleController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/health', getOracleHealth);
router.get('/empleados', getEmpleados);
router.get('/contratos', getContratos);
router.get('/permisos', getPermisos);
router.get('/nominas-efectivas', getNominasEfectivas);
router.get('/info-trabajador', getInfoTrabajador);
router.get('/carga-familiar', getCargaFamiliar);
router.get('/meses', getMeses);
router.get('/nominas-pago', getNominasPago);

module.exports = router;