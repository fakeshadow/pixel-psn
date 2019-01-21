const profiles = [];

module.exports = class Profile {
    constructor(accessToken, refreshToken, expiresIn) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }
    
    save() {
        profiles.push(this);
    }

    static getProfile() {
        return Profiles;
    }
}