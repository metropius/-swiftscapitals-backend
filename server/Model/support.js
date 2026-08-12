

const mongoose = require('mongoose');


const ticketSchema = new mongoose.Schema({
    
    subject: {
        type: String,
    },
     
 name:{
    type: String,
},
 
email: {
    type: String,
},

    message:{
        type: String,
    },

    priority:{
        type: String
    },

    image:{
        type: String,
    },
    status: {
        type: String,
        default: 'pending'
    },

    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        // required: true
    }
}, {timestamps: true});

const Ticket = mongoose.model('ticket', ticketSchema);

module.exports = Ticket;