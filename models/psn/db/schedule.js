const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const scheduleSchema = new Schema({
    _id: {
        type: String
    },
    games : {
        type: Array,
        required: true
    }
})

module.exports = mongoose.model('Schedule', scheduleSchema);