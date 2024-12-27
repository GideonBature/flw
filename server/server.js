const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

// Automated escrow release scheduler (runs every hour)
const { processEscrowPayments, refundPayment } = require('./controllers/paymentController');

// cron.schedule('0 * * * *', async () => {
//     console.log('Running automated escrow release check...');
//     await processEscrowPayments();
// });

cron.schedule('* * * * *', async () => {
    console.log('Running automated refund...');

    const transactionId = "8293932";

    const verifyResponse = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
            headers: {
                'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
                'Content-Type': 'application/json',
            }
        }
    );
    console.log('Transaction verification:', verifyResponse.data);

    try {
        console.log('Running automated refund...');

        const refundPayload = {
            comments: "Product out of stock."
        };

        
        const refundResponse = await axios.post(
            `https://api.flutterwave.com/v3/transactions/${transactionId}/refund`,
            refundPayload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        if (refundResponse.data) {
            console.log('Refund Response data:', refundResponse.data);
            return refundResponse.data; // Return the response data
        } else {
            console.error('No response data received');
        }
    } catch (error) {
        console.error('Refund Error:', error.response ? error.response.data : error.message);
        throw error; // Re-throw the error to be handled by the caller
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
