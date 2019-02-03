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
            // npCommunicationId: { type: Schema.Types.ObjectId, ref: 'Trophylist', required: true },
            npCommunicationId: { type: String, required: true },
            progress: { type: Number, requied: true },
            earnedTrophies: { type: Object, requied: true },
            lastUpdateDate: { type: Date, requied: true },
        }
    ]
})

profileSchema.methods.addGames = function (gamesNew) {
    const gamesOld = [...this.games];
    for (let gameNew of gamesNew) {
        let index = gamesOld.findIndex(gameOld => gameOld.npCommunicationId === gameNew.npCommunicationId)
        if (index >= 0 && gamesOld[index].progress < gameNew.progress) {
            gamesOld[index] = {
                npCommunicationId: gameNew.npCommunicationId,
                progress: gameNew.progress,
                earnedTrophies: gameNew.earnedTrophies,
                lastUpdateDate: gameNew.lastUpdateDate,
            };
        } else if (index < 0) {
            gamesOld.unshift({
                npCommunicationId: gameNew.npCommunicationId,
                progress: gameNew.progress,
                earnedTrophies: gameNew.earnedTrophies,
                lastUpdateDate: gameNew.lastUpdateDate,
            });
        }
    }
    this.games = gamesOld;
    return this.save();
}

module.exports = mongoose.model('Profile', profileSchema);