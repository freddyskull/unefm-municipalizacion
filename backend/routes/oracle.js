const express = require('express');
const router = express.Router();
const {
  getContratos,
  getNominasEfectivas,
  getInfoTrabajador,
  getCargaFamiliar,
  getMeses,
  getNominasPago,
  getEmpleados,
} = require('../controllers/oracleController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/empleados', getEmpleados);
router.get('/contratos', getContratos);
router.get('/nominas-efectivas', getNominasEfectivas);
router.get('/info-trabajador', getInfoTrabajador);
router.get('/carga-familiar', getCargaFamiliar);
router.get('/meses', getMeses);
router.get('/nominas-pago', getNominasPago);

module.exports = router;