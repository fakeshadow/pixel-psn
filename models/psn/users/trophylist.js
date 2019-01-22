const trophylist = [];
const finaldata = [];

module.exports = class Trophylist {
    constructor(npCommunicationId, comparedUser) {
        this.npCommunicationId = npCommunicationId;
        this.comparedUser = comparedUser;
    }
    
    save() {
        trophylist.push(this);
    }

    static fetchAll() {
        return trophylist;
    }

    static final(data) {
        finaldata.push(data);
    }

    static fetchFinal(callback) {
        callback(finaldata);
    }
}