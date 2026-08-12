const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  cardType: {
    type: String,
    enum: ['visa', 'mastercard', 'american_express'],
    required: true
  },
  cardLevel: {
    type: String,
    enum: ['standard', 'gold', 'platinum', 'black'],
    required: true
  },
  cardNumber: {
    type: String,
    required: true,
    unique: true
  },
  expiryDate: {
    type: String, // MM/YY
    required: true
  },
  cvv: {
    type: String,
    required: true
  },
  cardHolderName: {
    type: String,
    required: true,
    trim: true
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },
  balance: {
    type: Number,
    default: 0
  },
  dailyLimit: {
    type: Number,
    required: true,
    min: 1000,
    max: 100000
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'expired', 'declined'],
    default: 'pending'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  activationDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, { timestamps: true });

cardSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model('Card', cardSchema);