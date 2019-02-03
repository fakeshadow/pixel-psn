const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const trophysetSchema = new Schema({
    _id: {
        type: String
    },
    
})

module.exports = mongoose.model('Trophyset', trophysetSchema);