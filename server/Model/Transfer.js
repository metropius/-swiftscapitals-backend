const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  // Common fields for all transfer types
  type: {
    type: String,
    required: true,
    enum: [
      'Local Transfer',
      'International Wire',
      'Cryptocurrency',
      'PayPal',
      'Wise Transfer',
      'Skrill',
      'Venmo',
      'Zelle',
      'Cash App',
      'Revolut',
      'Alipay',
      'WeChat Pay'
    ]
  },

  transferFrom: {
    type: String,
    enum: ['usd', 'btc'],
    default: 'usd'
  },

  amount: {
    type: Number,
    required: true,
    min: 0.01
  },

  Bamount: {    // Before amount (balance before transfer)
    type: String,
    default: "Loading"
  },

  Afamount: {   // After amount (balance after transfer)
    type: String,
    default: "Loading"
  },

  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'cancelled']
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },

  note: {
    type: String,
    trim: true
  },

  pin: {
    type: String,
    required: true
  },

  // NEW fields for internal local transfers (credit/debit classification + sender name)
  isIncoming: {
    type: Boolean,
    default: false
  },
  counterpartName: {
    type: String,
    default: null
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: null
  },

  // ────────────────────────────────────────────────
  // Local Transfer fields
  // ────────────────────────────────────────────────
  Bank: { type: String },
  bankname: { type: String },
  accountname: { type: String },
  accountnumber: { type: String },
  Accounttype: { type: String },

  // ────────────────────────────────────────────────
  // International Wire fields
  // ────────────────────────────────────────────────
  bank_Address: { type: String },
  bank_iban: { type: String },
  swiftCode: { type: String },
  country: { type: String },

  // ────────────────────────────────────────────────
  // Crypto fields
  // ────────────────────────────────────────────────
  cryptoCurrency: { type: String },
  cryptoNetwork: { type: String },
  walletAddress: { type: String },

  // ────────────────────────────────────────────────
  // PayPal / Wise / Skrill / etc.
  // ────────────────────────────────────────────────
  paypalEmail:       { type: String },
  wiseFullName:      { type: String },
  wiseEmail:         { type: String },
  wiseCountry:       { type: String },
  skrillEmail:       { type: String },
  skrillFullName:    { type: String },
  venmoUsername:     { type: String },
  venmoPhone:        { type: String },
  zelleEmail:        { type: String },
  zellePhone:        { type: String },
  zelleName:         { type: String },
  cashAppTag:        { type: String },
  cashAppFullName:   { type: String },
  revolutFullName:   { type: String },
  revolutEmail:      { type: String },
  revolutPhone:      { type: String },
  alipayId:          { type: String },
  alipayFullName:    { type: String },
  wechatId:          { type: String },
  wechatName:        { type: String },

  // Audit
}, { timestamps: true });

module.exports = mongoose.model('transferMoney', transferSchema);