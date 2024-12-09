const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: String,// mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lawyerId: {
        type: String,// mongoose.Schema.Types.ObjectId,
        ref: 'Lawyer',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_escrow', 'completed', 'refunded', 'disputed'],
        default: 'pending'
    },
    flutterwaveRef: {
        type: String,
        required: true
    },
    escrowReleaseDate: {
        type: Date,
        required: true
    },
    hasComplaint: {
        type: Boolean,
        default: false
    },
    complaintDetails: {
        type: String
    },
    complaintStatus: {
        type: String,
        enum: ['none', 'pending', 'resolved', 'invalid'],
        default: 'none'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
