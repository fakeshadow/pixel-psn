const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const profileWorkerSchema = new Schema({
    npId: {
        type: String,
        required: true
    },
    onlineId : {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('ProfileWorker', profileWorkerSchema);