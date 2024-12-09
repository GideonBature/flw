// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    CircularProgress
} from '@mui/material';
import { initiatePayment } from '../services/api';
import { toast } from 'react-toastify';

// eslint-disable-next-line react/prop-types
const PaymentForm = ({ lawyerId, userId }) => {
    const [amount, setAmount] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await initiatePayment({
                amount: parseFloat(amount),
                email,
                lawyerId,
                userId
            });

            // Redirect to Flutterwave payment page
            if (response.paymentUrl) {
                window.location.href = response.paymentUrl;
            }
        } catch (error) {
            toast.error(error.message || 'Payment initiation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Make Payment to Lawyer
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Amount (NGN)"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    required
                />
                <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    sx={{ mt: 2 }}
                >
                    {loading ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : (
                        'Pay Now'
                    )}
                </Button>
            </Box>
        </Paper>
    );
};

export default PaymentForm;
