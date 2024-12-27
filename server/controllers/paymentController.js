const axios = require('axios');
const Transaction = require('../models/Transaction');
const Lawyer = require('../models/Lawyer');
const dotenv = require('dotenv');
const { mongoose } = require('mongoose');

// Load environment variables
dotenv.config({ path: './.env' });

// const Flutterwave = require('flutterwave-node-v3');
// const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

exports.initiatePayment = async (req, res) => {
    try {
        const { amount, userId, lawyerId, email } = req.body;

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const lawyerObjectId = new mongoose.Types.ObjectId(lawyerId);

        console.log(userObjectId);
        console.log(lawyerObjectId);

        // Create transaction record
        const transaction = await Transaction.create({
            userId: userObjectId,
            lawyerId: lawyerObjectId,
            amount,
            status: 'pending',
            flutterwaveRef: `FLW-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            escrowReleaseDate: new Date(Date.now() + (30 * 1000)) // 72 hours from now
        });

        // Initialize Flutterwave payment using direct API call
        const payload = {
            tx_ref: transaction.flutterwaveRef,
            amount: amount,
            currency: "NGN",
            redirect_url: `${req.protocol}://${req.get('host')}/api/payments/verify`,
            meta: {
                consumer_id: userId,
                transaction_id: transaction._id
            },
            customer: {
                email: email
            },
            customizations: {
                title: "Legal Service Payment",
                description: "Payment for legal services",
                logo: "https://your-logo-url.com"
            }
        };

        console.log(payload);

        const response = await axios.post('https://api.flutterwave.com/v3/payments', payload, {
            headers: {
                'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        console.log(response.data);
        
        res.status(200).json({
            success: true,
            paymentUrl: response.data.data.link,
            transactionId: transaction._id
        });
    } catch (error) {
        console.error('Payment initiation error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Error initiating payment'
        });
    }
};

// exports.verifyPayment = async (req, res) => {
//     try {
//         const { transaction_id, status, tx_ref } = req.query;
        
//         if (status === 'successful') {
//             // Verify the transaction
//             const verifyResponse = await axios.get(
//                 `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
//                         'Content-Type': 'application/json',
//                     }
//                 }
//             );

//             if (verifyResponse.data.status === "success") {
//                 const transaction = await Transaction.findOne({ 
//                     flutterwaveRef: tx_ref 
//                 });

//                 if (!transaction) {
//                     return res.status(404).json({
//                         success: false,
//                         message: 'Transaction not found'
//                     });
//                 }

//                 transaction.status = 'in_escrow';
//                 await transaction.save();

//                 // Update lawyer's escrow balance
//                 const lawyer = await Lawyer.findById(transaction.lawyerId);
//                 if (lawyer) {
//                     lawyer.escrowBalance += transaction.amount;
//                     lawyer.activeTransactions.push(transaction._id);
//                     await lawyer.save();
//                 }

//                 res.status(200).json({
//                     success: true,
//                     message: 'Payment verified and in escrow'
//                 });
//             } else {
//                 res.status(400).json({
//                     success: false,
//                     message: 'Payment verification failed'
//                 });
//             }
//         } else {
//             res.status(400).json({
//                 success: false,
//                 message: 'Payment was not successful'
//             });
//         }
//     } catch (error) {
//         console.error('Payment verification error:', error.response?.data || error.message);
//         res.status(500).json({
//             success: false,
//             message: 'Error verifying payment'
//         });
//     }
// };

exports.verifyPayment = async (req, res) => {
    try {
        const { transaction_id, status, tx_ref } = req.query;

        console.log('Received query:', { transaction_id, status, tx_ref });

        if (status !== 'successful') {
            return res.status(400).json({
                success: false,
                message: 'Payment was not successful'
            });
        }

        // Verify the transaction with Flutterwave
        const verifyResponse = await axios.get(
            `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log('Flutterwave Verification Response:', verifyResponse.data);

        if (verifyResponse.data.status !== "success") {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        const transaction = await Transaction.findOne({
            flutterwaveRef: tx_ref
        });

        console.log('Transaction:', transaction);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        transaction.status = 'in_escrow';
        await transaction.save();

        console.log('Transaction updated:', transaction);

        // Update lawyer's escrow balance
        const lawyer = await Lawyer.findById(transaction.lawyerId);
        console.log('Lawyer:', lawyer);

        if (lawyer) {
            lawyer.escrowBalance += transaction.amount;
            lawyer.activeTransactions.push(transaction._id);
            await lawyer.save();
        }

        console.log('lawyer:', lawyer);

        res.status(200).json({
            success: true,
            message: 'Payment verified and in escrow'
        });

    } catch (error) {
        console.error('Payment verification error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment'
        });
    }
};


exports.processEscrowPayments = async () => {
    try {
        const now = new Date();
        const transactions = await Transaction.find({
            status: 'in_escrow',
            escrowReleaseDate: { $lte: now },
            hasComplaint: false
        }).populate('lawyerId');

        for (const transaction of transactions) {
            const lawyer = transaction.lawyerId;

            // Initiate transfer to lawyer's bank account using direct API call
            const payload = {
                account_bank: '044',// lawyer.bankDetails.bankCode,
                account_number: '0690000031',//lawyer.bankDetails.accountNumber,
                amount: 20000,// transaction.amount,
                currency: "NGN",
                reference: `TRANSFER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                // callback_url: `${process.env.BASE_URL}/api/payments/transfer-webhook`,
                narration: `Payment for Services`,
                debit_currency: "NGN"
            };

            const transferResponse = await axios.post(
                'https://api.flutterwave.com/v3/transfers',
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            console.log('Transfer Response:', transferResponse.data);

            if (transferResponse.data.status === "success") {
                transaction.status = 'completed';
                await transaction.save();

                // Update lawyer's escrow balance
                lawyer.escrowBalance -= transaction.amount;
                lawyer.activeTransactions = lawyer.activeTransactions.filter(
                    t => t.toString() !== transaction._id.toString()
                );
                await lawyer.save();
            }
        }
    } catch (error) {
        console.error('Error processing escrow payments:', error.response?.data || error.message);
    }
};

exports.fileComplaint = async (req, res) => {
    try {
        const { transactionId, complaintDetails } = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        transaction.hasComplaint = true;
        transaction.complaintDetails = complaintDetails;
        transaction.complaintStatus = 'pending';
        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Complaint filed successfully'
        });
    } catch (error) {
        console.error('Error filing complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Error filing complaint'
        });
    }
};

exports.refundPayment = async (req, res) => {
    try {
        const { transactionId } = req.body;

        // Find the transaction in your database
        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        if (transaction.status !== 'in_escrow') {
            return res.status(400).json({
                success: false,
                message: 'Only transactions in escrow can be refunded'
            });
        }

        // Initiate refund request to Flutterwave
        const refundPayload = {
            amount: transaction.amount, // Optional, full refund if omitted
            currency: "NGN"
        };

        const refundResponse = await axios.post(
            `https://api.flutterwave.com/v3/transactions/${transaction.flutterwaveRef}/refund`,
            refundPayload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log('Refund Response:', refundResponse.data);

        if (refundResponse.data.status !== 'success') {
            return res.status(400).json({
                success: false,
                message: 'Refund failed',
                data: refundResponse.data
            });
        }

        // Update transaction status in the database
        transaction.status = 'refunded';
        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: refundResponse.data
        });
    } catch (error) {
        console.error('Refund error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Error processing refund'
        });
    }
};
