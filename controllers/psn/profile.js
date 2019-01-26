const fetch = require('node-fetch');
const querystring = require('querystring');
const token = require('./tokens');
const Profile = require('../../models/psn/users/profiles');

require('dotenv').config();


// need to work out the fields
exports.getProfile = (req, res) => {
    const accessToken = token.getLocalToken();
    const fields = {
        'fields': '@default,relation,requestMessageFlag,presence,@personalDetail,trophySummary',
    }
    console.log(`${process.env.USERS_API}${req.params.onlineId}/profile?` + querystring.stringify(fields))
    fetch(`${process.env.USERS_API}${req.params.onlineId}/profile?` + querystring.stringify(fields),
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            redirect: 'follow',
        })
        .then(res => res.json())
        .then(pro => {
            const profile = new Profile(pro.onlineId, pro.npId, pro.avatarUrl, pro.aboutMe, pro.plus, pro.trophySummary);
            profile.save();
            res.json(pro);
        })
}

