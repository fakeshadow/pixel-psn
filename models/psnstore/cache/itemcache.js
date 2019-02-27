const storeItemCache = [];

module.exports = class StoreItemCache {
    constructor(storeItemId) {
        this.storeItemId = storeItemId;
    }
    add() {
        storeItemCache.push(this);
    }
    static get() {
        return cutDuplicate(storeItemCache);
    }
}

cutDuplicate = ids => {
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            if (ids[i].storeItemId === ids[j].storeItemId) {
                ids.splice(j--, 1);
            }
        }
    }
    return ids;
}