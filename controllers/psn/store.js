const request = require('request');

const StoreItem = require('../../models/psnstore/db/item');


exports.search = (req, res) => {
    searchGame(req.params.gameName)
        .then(rawData => sortGameDetail(rawData.included))
        .then(sortedDetail => {
            saveDetail(sortedDetail);
            res.json(sortedDetail);
        })
        .catch(err => console.log(err));
}


exports.test = (req, res) => {
}

sortGameDetail = async (included) => {
    const ids = included.map(included => included.id);
    let temp;
    let rawDetail = [];
    for (let id of ids) {
        try {
            temp = await showGameDetail(id);
        }
        catch (err) {
            console.log(err);
        }
        rawDetail = rawDetail.concat(temp);
    }
    return rawDetail
        .filter(rawDetail => (rawDetail.type == 'game'))
        .map(sortDetail => ({
            '_id': sortDetail.id,
            'attributes': sortDetail.attributes
        }))
}

saveDetail = detail => {
    for (let d of detail) {
        StoreItem
            .findById(d._id)
            .then(res => {
                if (!res) {
                    const storeItem = new StoreItem({
                        _id: d._id,
                        attributes: d.attributes
                    })
                    return storeItem.save();
                }
            })
            .catch(err => console.log(err));
    }
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