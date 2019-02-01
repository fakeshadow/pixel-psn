const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const storeItemSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    attributes: {
        type: Object,
        required: true
    }
})

module.exports = mongoose.model('StoreItem', storeItemSchema);