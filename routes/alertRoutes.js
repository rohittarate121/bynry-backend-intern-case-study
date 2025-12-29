const express = require('express');
const router = express.Router();
const { getLowStockAlerts } = require('../controllers/alertController');

router.get('/:company_id/alerts/low-stock', getLowStockAlerts);

module.exports = router;
