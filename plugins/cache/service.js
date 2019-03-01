'use strict'

class CacheService {
    constructor(redis) {
        this.redis = redis
    }

    async getWork(type) {
        return this.redis.zrange(`worker:${type}`, 0, 1)
    }

    async addWork(type, work) {
        const isExisted = await this.redis.zscore(`worker:${type}`, work);
        if (!isExisted) return this.redis.zadd(`worker:${type}`, 0, work);
        return null;
    }

    async deleteWork(type, work) {
        return this.redis.zrem(`worker:${type}`, work);
    }

    async blacklist(query) {
        const { ip, psnid } = query;
        if (ip !== undefined) {
            return this.redis.zscore('blacklist:ip', ip);
        }
    }
}

module.exports = CacheService;