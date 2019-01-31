const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const scheduleSchema = new Schema({
    npId: {
        type: String,
        required: true
    },
    onlineId : {
        type: String,
        required: true
    },
    npCommunicationId : {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Schedule', scheduleSchema);