'use strict'

const PSNHelper = require('../../util/psn');
const psn = new PSNHelper;

class PSNService {
    constructor(psnCollection) {
        this.psnCollection = psnCollection;
    }

    async login(req) {
        const { uuid, tfa } = req;
        const { access_token, refresh_token } = await psn.getAcceeToken(uuid, tfa);
        if (!access_token) throw new Error('login failed')
        accessToken.set = access_token;
        await this.psnCollection.findOneAndUpdate({ refresh_token }, { $set: { refresh_token, access_token } }, { upsert: true });
        return { message: 'success' };
    }

    async refreshAccessToken() {
        const { refresh_token } = await this.psnCollection.findOne({ refresh_token: { $exists: 1 } });
        const { access_token } = await psn.refreshAccessToken(refresh_token);
        accessToken.set = access_token;
        await this.psnCollection.findOneAndUpdate({ refresh_token }, { $set: { access_token } }, { upsert: false });
    }

    async getPSNProfileRemote(query) {
        const { npid, onlineId } = query;
        await this.hasToken();
        return psn.getProfile(onlineId, accessToken.get);
    }

    async getUserTrophySummaryRemote(query) {
        const { onlineId, npId } = query;
        await this.hasToken();
        const summary = [];
        let offset = 0;
        let total = 0;
        do {
            const { totalResults, trophyTitles } = await psn.getSummary(offset, onlineId, accessToken.get);
            trophyTitles.forEach(list => summary.push({
                npCommunicationId: list.npCommunicationId,
                progress: list.comparedUser.progress,
                earnedTrophies: list.comparedUser.earnedTrophies,
                lastUpdateDate: list.comparedUser.lastUpdateDate,
            }))
            total = totalResults;
            offset += 100;
        } while (offset <= total && total > 100)
        await this.psnCollection.findOneAndUpdate({ npId, tropyList: { $exists: 1 } }, { $set: { onlineId, trophyList: summary } }, { upsert: true })
    }

    async getStoreItemRemote(query) {
        const { gameName } = query;
        const { included } = await psn.searchGame(gameName);
        const ids = included.map(include => ({ gameId: include.id }))
        const rawGames = await Promise.all(ids.map(async id => {
            const { included } = await psn.showGameDetail(id.gameId)
            return included[0]
        }))
        const sortedGames = rawGames.map(item => setStoreItemField(item))
        return sortedGames
    }

    async sendMessageRemonte(query) {

    }

    async getUserLocal(query) {
        const { onlineId } = query;
        // failsafe for onlineId conflict
        const users = await this.psnCollection.find({ onlineId, trophyList: { $exists: 0 } }, { sort: { lastUpdateDate: -1 } }).toArray();
        const { npId } = users[0]
        const profile = await this.psnCollection.aggregate([
            { $match: { npId } },
            {
                $group: {
                    _id: null,
                    npId: { $max: '$npId' },
                    onlineId: { $max: '$onlineId' },
                    region: { $max: '$region' },
                    avatarUrl: { $max: '$avatarUrl' },
                    aboutMe: { $max: '$aboutMe' },
                    languagesUsed: { $max: '$languagesUsed' },
                    plus: { $max: '$plus' },
                    trophySummary: { $max: '$trophySummary' },
                    games: { $max: '$trophyList' }
                }
            },
            { $project: { _id: 0 } }
        ]).toArray()
        return profile[0]
    }

    async getUserTrophiesLocal(query) {
        const { npid, onlineId } = query;
        return this.psnCollection.findOne({ onlineId: onlineId });
    }

    async updateProfileLocal(profile) {
        const { npId } = profile;
        if (!npId) throw new Error('profileData validation failed')
        const profileField = setProfileField(profile);
        const { value } = await this.psnCollection.findOneAndUpdate({ npId: npId }, { $set: profileField }, { projection: { _id: 0 }, upsert: true })
        return value
    }

    async hasToken() {
        if (accessToken.get === null) {
            return this.setAccessTokenLocal();
        }
    }

    async setAccessTokenLocal() {
        const { access_token } = await this.psnCollection.findOne({ access_token: { $exists: 1 } });
        accessToken.set = access_token;
    }
}

module.exports = PSNService;

const accessToken = {
    accessToken: null,
    get get() {
        return this.accessToken
    },
    set set(token) {
        this.accessToken = token;
    }
}

function setProfileField(profile) {
    const date = new Date()
    return {
        npId: profile.npId,
        onlineId: profile.onlineId,
        region: profile.region,
        avatarUrl: profile.avatarUrl,
        aboutMe: profile.aboutMe,
        languagesUsed: profile.languagesUsed,
        plus: profile.plus,
        trophySummary: profile.trophySummary,
        lastUpdateDate: date
    }
}

function setStoreItemField(item) {
    const prices = item.attributes.skus.map(sku => ({ noPlus: sku.prices['non-plus-user'], plus: sku.prices['plus-user'] }))
    let price1 = 0;
    let price2 = 0;
    let discountRate1 = 0;
    let discountRate2 = 0;
    let originalPrice1 = 0;
    let originalPrice2 = 0;
    let startDate1 = null;
    let startDate2 = null;
    let endDate1 = null;
    let endDate2 = null;
    for (let p of prices) {
        if (p.noPlus['discount-percentage'] == 0 && p.plus['discount-percentage'] == 0) {
            price1 += p.noPlus['actual-price'].value;
            price2 += p.plus['actual-price'].value;
        } else {
            discountRate1 > p.noPlus['discount-percentage'] ? discountRate1 = discountRate1 : discountRate1 = p.noPlus['discount-percentage'];
            discountRate2 > p.plus['discount-percentage'] ? discountRate2 = discountRate2 : discountRate2 = p.plus['discount-percentage'];
            originalPrice1 += p.noPlus['strikethrough-price'].value;
            originalPrice2 += p.plus['strikethrough-price'].value;
            price1 += p.noPlus['actual-price'].value;
            price2 += p.plus['actual-price'].value;
            startDate1 > p.noPlus.availability['start-date'] ? startDate1 = startDate1 : startDate1 = p.noPlus.availability['start-date'];
            startDate2 > p.plus.availability['start-date'] ? startDate2 = startDate2 : startDate2 = p.plus.availability['start-date'];
            endDate1 > p.noPlus.availability['end-date'] ? endDate1 = endDate1 : endDate1 = p.noPlus.availability['end-date'];
            endDate2 > p.plus.availability['end-date'] ? endDate2 = endDate2 : endDate2 = p.plus.availability['end-date'];
        }
    }
    return {
        id: item.id,
        type: item.type,
        'badge-info': item.attributes['badge-info'],
        fileSize: item.attributes['file-size'],
        gameContentType: item.attributes['game-content-type'],
        genres: item.attributes.genres,
        name: item.attributes.name,
        prices: {
            noPlus: {
                originalPrice: originalPrice1,
                price: price1,
                discount: discountRate1,
                startDate: startDate1,
                endDate: endDate1
            },
            plus: {
                originalPrice: originalPrice2,
                price: price2,
                discount: discountRate2,
                startDate: startDate2,
                endDate: endDate2
            }
        },
        'game-content-type': item.attributes['game-content-type'],
        description: item.attributes['long-description'],
        mediaList: item.attributes['media-list'],
        platforms: item.attributes.platforms,
        provider: item.attributes['provider-name'],
        releaseDate: item.attributes['release-date'],
        starRating: item.attributes['star-rating'],
        subTitles: item.attributes['subtitle-language-codes'],
        thumbNail: item.attributes['thumbnail-url-base'],
        history: null,
    }
}

// function updateStoreItemHistory(sortedItem) {
//     if (noPlus.endDate < endDate1 || storeItem.prices.plus.endDate < endDate2) {
//         let history;
//         if (storeItem.prices.noPlus.endDate != null || storeItem.prices.plus.endDate != null) {
//             history = [...storeItem.history, storeItem.prices];
//         }
//         storeItem.prices = {
//             'noPlus': {
//                 'originalPrice': originalPrice1,
//                 'price': price1,
//                 'discount': discountRate1,
//                 'startDate': startDate1,
//                 'endDate': endDate1
//             },
//             'plus': {
//                 'originalPrice': originalPrice2,
//                 'price': price2,
//                 'discount': discountRate2,
//                 'startDate': startDate2,
//                 'endDate': endDate2
//             }
//         };
//         storeItem.history = history;
//     }