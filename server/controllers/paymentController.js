const axios = require('axios');
const Transaction = require('../models/Transaction');
const Lawyer = require('../models/Lawyer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

exports.initiatePayment = async (req, res) => {
    try {
        const { amount, userId, lawyerId, email } = req.body;

        // Create transaction record
        const transaction = await Transaction.create({
            userId,
            lawyerId,
            amount,
            status: 'pending',
            flutterwaveRef: `FLW-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            escrowReleaseDate: new Date(Date.now() + (72 * 60 * 60 * 1000)) // 72 hours from now
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
        console.log(process.env.FLW_SECRET_KEY);

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

exports.verifyPayment = async (req, res) => {
    try {
        const { transaction_id, status, tx_ref } = req.query;
        
        if (status === 'successful') {
            // Verify the transaction
            const verifyResponse = await axios.get(
                `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (verifyResponse.data.status === "success") {
                const transaction = await Transaction.findOne({ 
                    flutterwaveRef: tx_ref 
                });

                if (!transaction) {
                    return res.status(404).json({
                        success: false,
                        message: 'Transaction not found'
                    });
                }

                transaction.status = 'in_escrow';
                await transaction.save();

                // Update lawyer's escrow balance
                const lawyer = await Lawyer.findById(transaction.lawyerId);
                if (lawyer) {
                    lawyer.escrowBalance += transaction.amount;
                    lawyer.activeTransactions.push(transaction._id);
                    await lawyer.save();
                }

                res.status(200).json({
                    success: true,
                    message: 'Payment verified and in escrow'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Payment verification failed'
                });
            }
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment was not successful'
            });
        }
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
                account_bank: lawyer.bankDetails.bankCode,
                account_number: lawyer.bankDetails.accountNumber,
                amount: transaction.amount,
                currency: "NGN",
                reference: `TRANSFER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                callback_url: `${process.env.BASE_URL}/api/payments/transfer-webhook`,
                narration: `Payment for transaction ${transaction._id}`
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
