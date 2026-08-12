const mongoose = require('mongoose');


const depositDetailsSchema = new mongoose.Schema({
    type:{
        type: String,
        required: true
    },
    amount: {
        type: String
    },
   
    status: {
        type: String,
        default: 'pending'
    },

    image:{
        type: String,
        // required: true
    },
   

    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        // required: true
    }
}, {timestamps: true});

const Depositdetails = mongoose.model('details', depositDetailsSchema);

module.exports = Depositdetails;