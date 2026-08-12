const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loan_amount: { type: String },
  loan_category: { type: String },
  loan_duration: { type: String },
  loan_income: { type: String },
  loan_reason: { type: String },
  status: { type: String, default: 'pending' },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  }
}, { timestamps: true });

const Loan = mongoose.model("loan", loanSchema);

module.exports = Loan;

