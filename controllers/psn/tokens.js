const fetch = require('node-fetch');

const qs = require('qs');
const querystring = require('querystring');

const fs = require('fs');
const path = require('path');

const p = path.join(path.dirname(process.mainModule.filename), 'token', `token.json`);

let accessToken;

exports.login = (req, res) => {
    getNpsso(req.body.uuId, req.body.twoFA)
        .then(res => res.json())
        .then(npsso => {
            return getGrant(npsso.npsso)
        })
        .then(res => {
            return res.headers.get('x-np-grant-code');
        })
        .then(code => {
            return getToken(code);
        })
        .then(res => res.json())
        .then(tok => {
            accessToken = tok.access_toke;
            fs.writeFile(p, JSON.stringify({"token": tok.refresh_token}), err => console.log(err));
        })
        .then(() => res.send('Logged in'))
        .catch(err => res.send(err));

}

// check token when service start
exports.checkToken = callback => {
    getRefreshToken(tok => {
        if (tok.token.length) {
            getaccessToken();
            callback(true);
        } else {
            callback(false);
        }
    })
}

//refresh access token hourly
exports.getTokenScheduled = () => {
    return getaccessToken();
}

// test 
exports.getStatus = (req, res) => {
    res.send(accessToken);
}

// Token stuff
getaccessToken = () => {
    getRefreshToken(tok => {
        fetch(`${process.env.AUTH_API}oauth/token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: qs.stringify({
                    app_context: 'inapp_ios',
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    refresh_token: tok.token,
                    duid: process.env.DUID,
                    scope: process.env.SCOPE,
                    grant_type: 'refresh_token'
                })
            })
            .then(res => res.json())
            .then(tok => {
                accessToken = tok.access_token;
                fs.readFile(p, (err, file) => {
                    return fs.writeFile(p, JSON.stringify({"token": tok.refresh_token}), err => console.log(err));
                })
            })
            .catch(err => res.send(err))
    });
}

getToken = grantcode => {
    return fetch(`${process.env.AUTH_API}oauth/token`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: qs.stringify({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                duid: process.env.DUID,
                scope: process.env.SCOPE,
                code: grantcode,
                grant_type: 'authorization_code'
            })
        })
}

getGrant = npsso => {
    const code_request = {
        "duid": process.env.DUID,
        "app_context": "inapp_ios",
        "client_id": process.env.CLIENT_ID,
        "scope": process.env.SCOPE,
        "response_type": "code",
    }
    return fetch(`${process.env.AUTH_API}oauth/authorize?` + querystring.stringify(code_request),
        {
            method: 'GET',
            headers: {
                'Cookie': `npsso=${npsso}`
            },
            redirect: 'manual',
            follow: 1
        })
}

getNpsso = (uuid, tfa) => {
    return fetch(`${process.env.AUTH_API}ssocookie`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: qs.stringify({
                authentication_type: 'two_step',
                client_id: process.env.CLIENT_ID,
                ticket_uuid: uuid,
                code: tfa
            })
        })
}

//local cache
getRefreshToken = callback => {
    fs.readFile(p, (err, file) => {
        if (err || !file.length) {
            return console.log('Token not found!')
        }
        callback(JSON.parse(file));
    });
}

exports.getLocalToken = () => {
    return accessToken;
}