const express = require('express');
const router = express.Router();
const {
    initiatePayment,
    verifyPayment,
    fileComplaint,
    refundPayment
} = require('../controllers/paymentController');

router.post('/initiate', initiatePayment);
router.get('/verify', verifyPayment);
router.post('/complaint', fileComplaint);
router.post('/refund', refundPayment); 


module.exports = router;
