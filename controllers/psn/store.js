const request = require('request');

const StoreItem = require('../../models/psnstore/db/item');
const StoreItemCache = require('../../models/psnstore/cache/itemcache');


exports.search = (req, res) => {
    searchGame(req.params.gameName)
        .then(rawData => sortGameDetail(rawData.included))
        .then(sortedDetail => {
            sortedDetail.forEach(sorted => {
                addToStoreCache(sorted.storeItemId);
            })
            res.json(sortedDetail);
            saveDetail(sortedDetail);
        })
        .catch(err => console.log(err));
}

exports.getGames = (req, res) => {
    StoreItem.find().then(result => res.json(result));
}

exports.test = async (req, res) => {
    const items = StoreItemCache.get();
    res.json(items)
}

exports.storeWorker = async () => {
    let temp = [];
    const items = StoreItemCache.get();
    for (let i = 0; i < items.length; i++) {
        try {
            const detail = await showGameDetail(items[i].storeItemId);
            temp.push({
                'storeItemId': items[i].storeItemId,
                'attributes': detail[0].attributes
            });
        } catch (err) {
            console.log(err);
        }
    }
    return saveDetail(temp);
}

// Build a cache for gameIds at system startup and use it to auto check store pages
exports.loadStoreItem = () => {
    return new Promise((resolve, reject) => {
        StoreItem
            .find()
            .then(items => {
                if (items) {
                    items.forEach(item => addToStoreCache(item._id));
                }
                return resolve();
            })
            .catch(err => reject(err));
    })
}

// store items cache
addToStoreCache = id => {
    const storeItemCache = new StoreItemCache(id);
    return storeItemCache.add();
}

// store stuff
searchGame = name => {
    return new Promise((resolve, reject) => {
        request.get({
            url: `${process.env.STORE_API}tumbler-search/${name}?suggested_size=999&mode=game`
        }, (err, response, body) => {
            if (err) {
                reject(JSON.parse(err));
            } else {
                resolve(JSON.parse(body));
            }
        })
    })
}

showGameDetail = gameId => {
    return new Promise((resolve, reject) => {
        request.get({
            url: `${process.env.STORE_API}resolve/${gameId}`
        }, (err, response, body) => {
            if (err) {
                reject(JSON.parse(err));
            } else {
                resolve(JSON.parse(body).included);
            }
        })
    })
}

sortGameDetail = async (included) => {
    const ids = included.map(included => included.id);
    let temp;
    let rawDetail = [];
    for (let i = 0; i < ids.length; i++) {
        try {
            temp = await showGameDetail(ids[i]);
            for (t of temp) {
                rawDetail.push(t);
            }
        } catch (err) {
            console.log(err);
        }
    }
    return rawDetail
        .filter(rawDetail => (rawDetail.type == 'game'))
        .map(sortDetail => ({
            'storeItemId': sortDetail.id,
            'attributes': sortDetail.attributes
        }))
}

saveDetail = detail => {
    for (let d of detail) {
        StoreItem
            .findById(d.storeItemId)
            .then(storeItem => {
                const prices = d.attributes.skus
                    .map(sku => ({
                        'noPlus': sku.prices['non-plus-user'],
                        'plus': sku.prices['plus-user']
                    }))
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
                if (!storeItem) {
                    const storeItem = new StoreItem({
                        _id: d.storeItemId,
                        fileSize: d.attributes['file-size'],
                        gameContentType: d.attributes['game-content-type'],
                        genres: d.attributes.genres,
                        name: d.attributes.name,
                        description: d.attributes['long-description'],
                        mediaList: d.attributes['media-list'],
                        platforms: d.attributes.platforms,
                        provider: d.attributes['provider-name'],
                        releaseDate: d.attributes['release-date'],
                        starRating: d.attributes['star-rating'],
                        subTitles: d.attributes['subtitle-language-codes'],
                        thumbNail: d.attributes['thumbnail-url-base'],
                        prices: {
                            'noPlus': {
                                'originalPrice': originalPrice1,
                                'price': price1,
                                'discount': discountRate1,
                                'startDate': startDate1,
                                'endDate': endDate1
                            },
                            'plus': {
                                'originalPrice': originalPrice2,
                                'price': price2,
                                'discount': discountRate2,
                                'startDate': startDate2,
                                'endDate': endDate2
                            }
                        }
                    })
                    return storeItem.save();
                } else if (storeItem.prices.noPlus.endDate < endDate1 || storeItem.prices.plus.endDate < endDate2) {
                    let history;
                    if (storeItem.prices.noPlus.endDate != null || storeItem.prices.plus.endDate != null) {
                        history = [...storeItem.history, storeItem.prices];
                    }
                    storeItem.prices = {
                        'noPlus': {
                            'originalPrice': originalPrice1,
                            'price': price1,
                            'discount': discountRate1,
                            'startDate': startDate1,
                            'endDate': endDate1
                        },
                        'plus': {
                            'originalPrice': originalPrice2,
                            'price': price2,
                            'discount': discountRate2,
                            'startDate': startDate2,
                            'endDate': endDate2
                        }
                    };
                    storeItem.history = history;
                    return storeItem.save();
                } else {
                    return;
                }
            })
            .catch(err => console.log(err));
    }
}

wait = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
}