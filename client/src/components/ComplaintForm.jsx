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
import { fileComplaint } from '../services/api';
import { toast } from 'react-toastify';

// eslint-disable-next-line react/prop-types
const ComplaintForm = ({ transactionId }) => {
    const [complaintDetails, setComplaintDetails] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await fileComplaint({
                transactionId,
                complaintDetails
            });
            toast.success('Complaint filed successfully');
            setComplaintDetails('');
        } catch (error) {
            toast.error(error.message || 'Failed to file complaint');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                File a Complaint
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Complaint Details"
                    multiline
                    rows={4}
                    value={complaintDetails}
                    onChange={(e) => setComplaintDetails(e.target.value)}
                    margin="normal"
                    required
                />
                <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    sx={{ mt: 2 }}
                    color="warning"
                >
                    {loading ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : (
                        'Submit Complaint'
                    )}
                </Button>
            </Box>
        </Paper>
    );
};

export default ComplaintForm;
