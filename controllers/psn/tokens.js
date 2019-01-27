const qs = require('qs');
const fs = require('fs');
const path = require('path');
const request = require('request');

const p = path.join(path.dirname(process.mainModule.filename), 'token', `token.json`);

let accessToken;

exports.login = (req, res) => {
    console.log(req.body)
    getNpsso(req.body.uuId, req.body.twoFA)
        .then(npsso => getGrant(npsso.npsso))
        .then(code => getToken(code))
        .then(tok => {
            accessToken = tok.access_toke;
            fs.writeFile(p, JSON.stringify({ "token": tok.refresh_token }), err => console.log(err));
        })
        .then(() => res.send('Logged in'))
        .catch(err => res.send(err));
}

// check token when service start
exports.checkToken = callback => {
    getLocalRefreshToken().then(tok => {
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
getToken = grantcode => {
    return new Promise((resolve, reject) => {
        request.post({
            url: `${process.env.AUTH_API}oauth/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: qs.stringify({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                duid: process.env.DUID,
                scope: process.env.SCOPE,
                code: grantcode,
                grant_type: 'authorization_code'
            })
        }, (err, response, body) => {
            if (err) {
                reject(JSON.parse(err));
            } else {
                resolve(JSON.parse(body));
            }
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
    return new Promise((resolve, reject) => {
        request.get({
            url: `${process.env.AUTH_API}oauth/authorize?` + qs.stringify(code_request),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            headers: {
                'Cookie': `npsso=${npsso}`
            },
            followRedirect: false
        }, (err, response, body) => {
            if (err) {
                reject(JSON.parse(err));
            } else {
                resolve(response.headers['x-np-grant-code']);
            }
        })
    })
}

getNpsso = (uuid, tfa) => {
    return new Promise((resolve, reject) => {
        request.post({
            url: `${process.env.AUTH_API}ssocookie`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: qs.stringify({
                authentication_type: 'two_step',
                client_id: process.env.CLIENT_ID,
                ticket_uuid: uuid,
                code: tfa
            })
        }, (err, response, body) => {
            if (err) {
                reject(JSON.parse(err));
            } else {
                resolve(JSON.parse(body));
            }
        })
    })
}

//local cache
getaccessToken = () => {
    getLocalRefreshToken()
        .then(tok => useRefreshToken(tok.token))
        .then(tok => {
            accessToken = tok.access_token
        })
        .catch(err => console.log(err));
}

getLocalRefreshToken = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(p, (err, file) => {
            if (err || !file.length) {
                reject(err);
            }
            resolve(JSON.parse(file));
        });
    })
}

useRefreshToken = token => {
    return new Promise((resolve, reject) => {
        request.post({
            url: `${process.env.AUTH_API}oauth/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: qs.stringify({
                app_context: 'inapp_ios',
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                refresh_token: token,
                duid: process.env.DUID,
                scope: process.env.SCOPE,
                grant_type: 'refresh_token'
            })
        }, (err, response, body) => {
            if (err) {
                reject(JSON.parse(err));
            } else {
                resolve(JSON.parse(body));
            }
        })
    })
}

exports.getLocalToken = () => {
    return accessToken;
}