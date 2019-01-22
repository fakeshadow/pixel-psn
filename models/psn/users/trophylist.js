const trophylist = [];
const trophydetail = [];

module.exports = class Trophylist {
    constructor(npCommunicationId, comparedUser) {
        this.npCommunicationId = npCommunicationId;
        this.comparedUser = comparedUser;
    }
    
    save() {
        trophylist.push(this);
    }

    static fetchAllList() {
        return trophylist;
    }

    static saveDetail(data) {
        trophydetail.push(data);
    }

    static fetchAllDetail(callback) {
        callback(trophydetail);
    }
}