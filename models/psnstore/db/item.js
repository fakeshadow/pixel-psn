const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const storeItemSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    fileSize: {
        type: Object
    },
    gameContentType : {
        type: String
    },
    name : {
        type: String
    },
    genres: {
        type: Array
    },
    description : {
        type: String
    },
    mediaList : {
        type: Object
    },
    platforms: {
        type: Array
    },
    provider: {
        type: String
    },
    releaseDate : {
        type: Date
    },
    starRating: {
        type: Object
    },
    subTitles: {
        type: Array
    },
    thumbNail: {
        type: String
    },
    prices: {
        type: Object,
        required: true
    },
    history: {
        type: Array
    }
})

module.exports = mongoose.model('StoreItem', storeItemSchema);