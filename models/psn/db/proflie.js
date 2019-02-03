const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const profileSchema = new Schema({
    _id: { type: String, required: true },
    onlineId: { type: String, required: true },
    region: { type: String, required: true },
    avatarUrl: { type: String },
    trophySummary: { type: Object, required: true },
    blockChainId: { type: String },
    lastUpdateTime: { type: Date, required: true },
    games: [
        {
            npCommunicationId: { type: String, ref: 'Trophyset', required: true },
            progress: { type: Number, requied: true },
            earnedTrophies: { type: Object, requied: true },
            lastUpdateDate: { type: Date, requied: true },
        }
    ]
})

profileSchema.methods.create = function (games, profile) {
    this._id = profile.npId;
    this.onlineId = profile.onlineId;
    this.region = profile.region;
    this.avatarUrl = profile.avatarUrl;
    this.trophySummary = profile.trophySummary;
    this.lastUpdateTime = new Date;
    this.games = games;
    return this.save();
}

profileSchema.methods.update = function (games, profile) {
    this.onlineId = profile.onlineId;
    this.region = profile.region;
    this.avatarUrl = profile.avatarUrl;
    this.trophySummary = profile.trophySummary;
    this.lastUpdateTime = new Date;
    this.games = games;
    return this.save();
}

module.exports = mongoose.model('Profile', profileSchema);