'use strict'

const http = require('../../util/httpClient');
const PSNHelper = require('../../util/psn');
const psn = new PSNHelper(http);

class PSNService {
    constructor(psnCollection) {
        this.psnCollection = psnCollection;
    }

    async login(req) {
        const { uuid, tfa } = req;
        const { access_token, refresh_token } = await psn.getAcceeToken(uuid, tfa);
        console.log('token: ',access_token);
        await this.psnCollection.findOneAndUpdate({ refreshToken: refresh_token }, { $set: { refreshToken: refresh_token, accessToken: access_token } }, { upsert: true });
        return { message: 'success' };
    }

    async refreshAccessToken() {
        const { value } = await this.psnCollection.findOne({ accessToken: { '$exist': 1 } });
        const { access_token } = await psn.refreshAccessToken(value);
        await this.psnCollection.findOneAndUpdate({ accessToken: access_token }, { upsert: true });
    }

    async getPSNProfileRemote(query) {
        const { npid, psnid } = query;
        return psn.getProfile(psnid, accessToken);
    }

    async getUserTrophiesLocal(query) {
        const { npid, psnid } = query;
        return this.psnCollection.findOne({ psnid: psnid });
    }

    async getAccessTokenLocal() {
        return this.psnCollection.findOne({ accessToken: { '$exist': 1 } });
    }
}

module.exports = PSNService;

