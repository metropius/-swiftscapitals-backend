const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  isSuspended: {
    type: Boolean,
    default: false,
  },
  firstname: {
    type: String,
  },
  midname: {
    type: String,
  },
  lastname: {
    type: String,
  },
   username: {
    type: String,
    unique: true,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, 'Please enter an email'], // Fixed validator syntax
  },
  limit: {
    type: String,
    default: "500,000,00"
  },
  country: {
    type: String
  },
  ref_no: {
    type: String,
    default: "1234567890"
  },
  postal: {
    type: String,
    default: "postal code"
  },
  address: {
    type: String,
    default: "your address"
  },
  state: {
    type: String,
    default: "your state"
  },
   account_no: {
    type: String,
    default: "your account number"
  },
  currency: {
    type: String,
    default: "$"
  },
  Dob: {
    type: String,
  },
  city: {
    type: String,
    default: "your city"
  },
  accounttype: {
    type: String,
  },
  password: {
    type: String,
    required: true, // Added required
  },
  image: {
    type: String,
  },
  balance: {
    type: String,
    default: "0.00"
  },
  btcBalance: {
  type: Number,
  default: 0
},
  total_deposit: {
    type: String,
    default: "0.00"
  },
  gender: {
    type: String,
  },
  fees: {
    type: String,
    default: "0.00"
  },
  
  pending: {
    type: String,
    default: "0.00"
  },
  pin: {
    type: String,
    required: true, // Added required
  },
  otp: {
    type: String, 
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
    default: null,
  },
  kycVerified: {
    type: Boolean,
    default: false,
  },
  verifiedStatus: {
    type: String,
    default: 'not Verified!',
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verificationTokenExpires: {
    type: Date,
    default: null,
  },
   resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  pendingTransfer: {
  type: mongoose.Schema.Types.Mixed,
  default: null
},
pendingTransferType: {
  type: String,
  default: null
},
pendingDeposit: {
  type: mongoose.Schema.Types.Mixed,
  default: null
},
  Depositdetails: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'details'
  },
  transfers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'transferMoney'
  },
  cards: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'card'
  },
  loans: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'loan'
  },
  tickets: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'ticket'
  },
  deposits: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'deposit'
  },
    wallets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  }],
   IRSRefunds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IRSRefund'
  }],
   kyc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Verification',
    default: null
  },
  otpSuspended: {
    type: Boolean,
    default: false
  },
  role: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Login static method (unchanged - plain text comparison)
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw Error('incorrect email');
  }

  if (user.isSuspended) {
    throw Error('Your account is suspended. If you believe this is a mistake, please contact support at support@signalsmine.org');
  }
  // Direct string comparison for passwords
  if (password !== user.password) {
    throw Error('incorrect password');
  }
  return user;
};

const User = mongoose.model('user', userSchema);

module.exports = User;