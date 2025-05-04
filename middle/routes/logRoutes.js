const express = require('express');
const router = express.Router();

const logController = require('../controllers/logController');

router.post('/getLogs', logController.getLogs);

module.exports = router;
