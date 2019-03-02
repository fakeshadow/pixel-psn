'use strict'

const PSNHelper = require('pxs-psn-api');
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
        const { onlineId } = query;
        await this.hasToken();
        return psn.getProfile(onlineId, accessToken.get);
    }

    async getTrophySummaryRemote(query) {
        try {
            const { onlineId } = query;
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

            if (summary.length !== total) throw new Error('summary length does not match total results')
            const { npId } = await psn.getProfile(onlineId, accessToken.get);
            await this.psnCollection.findOneAndUpdate({ npId, trophySummary: { $exists: 1 } }, { $set: { onlineId, trophyList: summary } }, { upsert: false })
        }
        catch (e) {
            throw e
        }
    }

    async getUserTrophiesLocal(query) {
        const { npCommunicationId, onlineId } = query;
        const { npId } = await this.psnCollection.findOne({ onlineId, trophySummary: { $exists: 1 } }, { projection: { _id: 0 } });
        return this.psnCollection.findOne({ npId, npCommunicationId }, { projection: { _id: 0 } });
    }

    async getUserTrophiesRemote(query) {
        await this.hasToken();
        const { npCommunicationId, onlineId } = query;
        return psn.getIndividualGame(npCommunicationId, onlineId, accessToken.get);
    }

    async updateUserTrophiesLocal({ npCommunicationId, trophiesNew }) {
        const { trophies } = trophiesNew
        const { comparedUser } = trophies[0];
        const { npId } = await psn.getProfile(comparedUser.onlineId, accessToken.get);
        const lastUpdateDate = new Date()
        return this.psnCollection.findOneAndUpdate({ npId, npCommunicationId }, { $set: { npId, npCommunicationId, trophies, lastUpdateDate } }, { upsert: true })
    }

    async sendMessageRemote(req) {
        await this.hasToken();
        try {
            if (req.body) {
                const { threadId } = await psn.generateNewMessageThread(onlineId, process.env.MYID, accessToken.get);
                if (!threadId) throw new Error('failed to generate new thread')
                const { message, onlineId } = req.body;
                return psn.sendMessage(threadId, message, null, accessToken.get);
            }
            return multipart(req);
        } catch (e) {
            throw e
        }
    }

    async getMessageRemote(query) {
        await this.hasToken();
        const { onlineId } = query;
        const { threadId } = await psn.generateNewMessageThread(onlineId, process.env.MYID, accessToken.get);
        if (!threadId) throw new Error('failed to generate new thread')
        return psn.getThreadDetail(threadId, 20, accessToken.get);
    }

    async getTrophySummaryLocal(query) {
        const { onlineId } = query;
        return this.psnCollection.findOne({ onlineId, trophySummary: { $exists: 1 } });
    }

    async updateProfileLocal(profile) {
        const { npId } = profile;
        if (!npId) throw new Error('profileData validation failed')
        const profileField = setProfileField(profile);
        this.psnCollection.findOneAndUpdate({ npId, trophySummary: { $exists: 1 } }, { $set: profileField }, { projection: { _id: 0 }, upsert: true })
    }

    async getStoreItemRemote(query) {
        const { gameName } = query;
        const lang = 'ch'
        const region = 'HK'
        const age = 19
        const { included } = await psn.searchGame(gameName, lang, region, age);

        if (!included.length) throw new Error('nothing found')

        const ids = included.map(include => ({ gameId: include.id }))
        const rawGames = await Promise.all(ids.map(async id => {
            const { included } = await psn.showGameDetail(id.gameId, lang, region, age)
            return included[0]
        }))
        const sortedGames = rawGames.map(item => setStoreItemField(item))

        return sortedGames
    }

    async getStoreItemLocal(query) {
        const { gameName } = query;
        // need to improve regex params.
        return this.psnCollection.find({ name: { '$regex': gameName, '$options': '$i' } }, { projection: { _id: 0 } }).toArray()
    }

    async updateStoreItemLocal(items) {
        const updateOnes = [];
        items.forEach(item => {
            const { id, ...others } = item
            updateOnes.push({
                updateOne: { filter: { id }, update: { id, ...others }, upsert: true }
            })
        })
        return this.psnCollection.bulkWrite(updateOnes);
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


function multipart(req) {
    return new Promise((resolve, reject) => {
        const options = {
            limits: {
                fieldNameSize: 100,
                fieldSize: 1000000,
                fields: 10,
                fileSize: 1000000,
                files: 5,
                headerPairs: 2000
            }
        };
        const mp = req.multipart(handler, done, options);
        mp.on('partsLimit', () => reject({
            'error': 'Maximum number of form parts reached'
        }));
        mp.on('filesLimit', () => reject({
            'error': 'Maximum number of files reached'
        }));
        mp.on('fieldsLimit', () => reject({
            'error': 'Maximim number of fields reached'
        }));

        async function handler(field, file, filename, encoding, mimetype) {
            try {
                const array = field.split(':')
                const onlineId = array[0];
                const message = array[1];
                const { threadId } = await psn.generateNewMessageThread(onlineId, process.env.MYID, accessToken.get);
                console.log(file)
                if (!threadId) throw new Error('failed to generate new thread')
                await psn.sendMessage(threadId, message, file, accessToken.get);
            } catch (e) {
                throw e
            }
        }

        function done(err) {
            if (err) {
                return reject(err)
            };
            resolve();
        }
    })
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
    let startDate2 = null
    let endDate1 = null
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