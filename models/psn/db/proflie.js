const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const profileSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    onlineId : {
        type: String,
        required: true
    },
    region : {
        type: String,
        required: true
    },
    avatarUrl : {
        type: String,
    },
    trophySummary: {
        type: Object,
        required: true
    },
    games : {
        type: Array,
    },
    blockChainId: {
        type: String,
    },
    lastUpdateTime: {
        type: Date,
        required: true
    }
})

module.exports = mongoose.model('Profile', profileSchema);