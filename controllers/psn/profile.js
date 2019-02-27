const request = require('request');
const qs = require('qs');
const token = require('./tokens');
const Profile = require('../../models/psn/db/proflie');

exports.getProfile = (req, res) => {
    Profile
        .findById({
            _id: req.params.onlineId
        })
        .then(result => {
            if (result) {
                return res.json(result);
            }
            const accessToken = token.getLocalToken();
            const fields = {
                'fields': '@default,relation,requestMessageFlag,presence,@personalDetail,trophySummary',
            }
            request.get({
                url: `${process.env.USERS_API}${req.params.onlineId}/profile?` + qs.stringify(fields),
                auth: {
                    'bearer': `${accessToken}`
                }
            }, (err, response, body) => {
                if (err) {
                    res.json(JSON.parse(err));
                } else {
                    res.json(JSON.parse(body));
                }
            })
        })
        .catch(err => res.json(err));
}

exports.getUserActivities = (req, res) => {
    const body = {
        includeComments: true,
        offset: 0,
        blockSize: 10
    }
    const accessToken = token.getLocalToken();
    request.get({
        url: `${process.env.ACTIVITY_API}v1/users/${req.body.onlineId}/${req.body.type}/${req.body.page}?` + qs.stringify(body),
        auth: {
            'bearer': `${accessToken}`
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        // body: qs.stringify({
        //     filters: PLAYED_GAME,
        //     filters: TROPHY,
        //     includeComments: false,
        //     offset: 1,
        //     blockSize: 5
        // }),
        gzip: true
    }, (err, response, body) => {
        if (err) {
            console.log(err)
            res.json(JSON.parse(err));
        } else {
            res.json(JSON.parse(body));
        }
    })
}