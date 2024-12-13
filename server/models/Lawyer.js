const mongoose = require('mongoose');

const lawyerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    bankDetails: {
        accountNumber: {
            type: String,
            required: true
        },
        bankCode: {
            type: String,
            required: true
        },
        accountName: {
            type: String,
            required: true
        }
    },
    escrowBalance: {
        type: Number,
        default: 0
    },
    activeTransactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Lawyer', lawyerSchema);
