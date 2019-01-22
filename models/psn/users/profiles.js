const profiles = [];

module.exports = class Profile {
    constructor(onlineId, npId, avatarUrl, aboutMe, plus, trophySummary) {
        this.onlineId = onlineId;
        this.npId = npId;
        this.avatarUrl = avatarUrl;
        this.aboutMe = aboutMe;
        this.plus = plus;
        this.trophySummary = trophySummary;
    }
    
    save() {
        profiles.push(this);
    }

    static fetchAll(callback) {
        callback(profiles);
    }
}