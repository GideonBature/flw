import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const initiatePayment = async (paymentData) => {
    try {
        const response = await api.post('/payments/initiate', paymentData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const fileComplaint = async (complaintData) => {
    try {
        const response = await api.post('/payments/complaint', complaintData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getTransactionStatus = async (transactionId) => {
    try {
        const response = await api.get(`/payments/status/${transactionId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
