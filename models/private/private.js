const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const privateSchema = new Schema({
    refreshToken: {
        type: String
    }
})

module.exports = mongoose.model('Private', privateSchema);