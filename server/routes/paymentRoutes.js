const express = require('express');
const router = express.Router();
const {
    initiatePayment,
    verifyPayment,
    fileComplaint
} = require('../controllers/paymentController');

router.post('/initiate', initiatePayment);
router.get('/verify', verifyPayment);
router.post('/complaint', fileComplaint);

module.exports = router;
