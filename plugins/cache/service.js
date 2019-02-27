'use strict'

class CacheService {
    constructor(redis) {
        this.redis = redis
    }

    async blacklist(query) {
        const { ip, psnid } = query;
        if (ip !== undefined) {
            return this.redis.zscore('blacklist:ip', ip);
        }
    }
}

module.exports = CacheService;