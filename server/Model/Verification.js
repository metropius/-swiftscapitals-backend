const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },

  // Personal Details
  fullname:        { type: String, required: [true, 'Full name is required'], trim: true, minlength: 3 },
  email:           { type: String, required: true, lowercase: true, trim: true },
  tel:             { type: String, required: [true, 'Phone number is required'], trim: true },
  title:           { type: String, required: true, enum: ['Mr.', 'Mrs.', 'Ms.', 'Miss.', 'Mr&Mrs.'] },
  gender:          { type: String, required: true, enum: ['Male', 'Female', 'Others'] },
  zipcode:         { type: String, required: true, trim: true },
  dateofBirth:     { type: Date, required: [true, 'Date of birth is required'] },

  // Employment
  statenumber:     { type: String, required: [true, 'State/ID/Security number is required'], trim: true },
  accounttype:     { type: String, required: true },
  employer:        { type: String, required: true },
  income:          { type: String, required: true },

  // Address
  address:         { type: String, required: true, trim: true },
  city:            { type: String, required: true, trim: true },
  state:           { type: String, required: true, trim: true },
  country:         { type: String, required: true, trim: true },

  // Next of Kin
  kinname:         { type: String, required: true, trim: true },
  kinaddress:      { type: String, required: true, trim: true },
  relationship:    { type: String, required: true, trim: true },
  age:             { type: Number, required: true, min: 18 },

  // Documents
  document_type:   { type: String, required: true, enum: ["Int'l Passport", "National ID", "Drivers License"] },
  frontimg:        { type: String, required: [true, 'Front side image is required'] },
  backimg:         { type: String, required: [true, 'Back side image is required'] },
  photo:           { type: String, required: [true, 'Passport photograph is required'] },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'under review', 'approved', 'rejected', 'declined'],
    default: 'pending'
  },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  reviewedAt:      { type: Date },
  rejectionReason: { type: String, trim: true },

}, { timestamps: true });

verificationSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Verification', verificationSchema);