const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const scheduleSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    games : {
        type: Array,
        required: true
    }
})

module.exports = mongoose.model('Schedule', scheduleSchema);