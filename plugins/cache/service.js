'use strict';

class CacheService {
    constructor(psnCollection) {
        this.psnCollection = psnCollection
    }

    async addWork(onlineId) {
        return this.psnCollection.findOneAndUpdate({ type: 'worker', onlineId }, { $set: { type: 'worker', onlineId } }, { upsert: true })
    }

    async deleteWork(onlineId) {
        return this.psnCollection.findOneAndDelete({ type: 'worker', onlineId })
    }

    async getWork() {
        return this.psnCollection.findOne({ type: 'worker', onlineId: { $exists: 1 } })
    }
}

module.exports = CacheService;