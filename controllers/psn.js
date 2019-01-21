const fetch = require('node-fetch');
const qs = require('qs');
const querystring = require('querystring');

const Cert = require('../models/psn/certs');
const Profile = require('../models/psn/profiles');

require('dotenv').config();

let accessToken;
let refreshToken;
let expiresIn;

exports.login = (req, res, next) => {
	getNpsso(req.params.uuid, req.params.tfa)
		.then(response => response.json())
		.then(json => {
			return getGrant(json.npsso)
		})
		.then(res => {
			return res.headers.get('x-np-grant-code');
		})
		.then(code => {
			return getToken(code)
		})
		.then(res => res.json())
		.then(json => {
			accessToken = json.access_token;
			refreshToken = json.refresh_token;
			expiresIn = json.expires_in;

			//todo: need to store timestamp and not overwrite existing tokens
			const cert = new Cert(accessToken, refreshToken, expiresIn);   
			console.log(cert);
			return cert.save();
		})
		.then(() => {
			res.send('Logged in')
		})
		.catch(err => res.send(err));
}

exports.getProfile = (req, res, next) => {
	const fields = '/profile?fields=%40default,relation,requestMessageFlag,presence,%40personalDetail,trophySummary'
	fetch(`${process.env.USERS_API}${req.params.onlineId}${fields}`,
		{
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			},
			redirect: 'follow',
		})
		.then(res => res.json())
		.then(pro => {
			console.log(pro);
			const profile = new Profile(pro.onlineId, pro.avatarUrl, pro.aboutMe, pro.trophySummary);
			profile.save();
			res.json(pro);
		})
}

exports.checkCert = () => {
	const cert = new Cert;
	cert.getCert(cert => {
		//todo: need to check timestamp
		if (cert && cert.expiresIn > 100) {
			accessToken = cert.accessToken;
			refreshToken = cert.refreshToken;
			expiresIn = cert.expiresIn;
		} else {
			console.log('Please refresh token!');
		}
	})
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

getExpireIn = () => {
	return expiresIn;
}

getRefreshToken = () => {
	return refreshToken;
}

getAccessToken = () => {
	return accessToken;
}
