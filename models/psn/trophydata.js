const trophiesData = []

module.exports = class TrophyData {
    constructor(accessToken, refreshToken, expiresIn) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }
    
    save() {
        trophiesData.push(this);
    }

    static getTrophies() {
        return trophiesData;
    }
}