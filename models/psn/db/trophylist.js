const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const listSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    trophies: {
        type: Array,
        required: true
    }
})


const trophylistSchema = new Schema({
    _id: {
        type: String
    },
    list: [listSchema]
})

module.exports = mongoose.model('Trophylist', trophylistSchema);