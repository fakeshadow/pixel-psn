const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const trophylistSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    lists: {
        type: Array,
        require: true
    }
})

module.exports = mongoose.model('Trophylist', trophylistSchema);