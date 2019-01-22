const fetch = require('node-fetch');
const qs = require('qs');
const querystring = require('querystring');

const Cert = require('../models/psn/certs');
const Profile = require('../models/psn/profiles');

require('dotenv').config();

let accessToken;
let refreshToken;

exports.login = (req, res) => {
	getNpsso(req.params.uuid, req.params.tfa)
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
		.then(token => {
			accessToken = token.access_token;
			refreshToken = token.refresh_token;
			//todo: need to store timestamp and not overwrite existing tokens
			const cert = new Cert(refreshToken);
			return cert.save();
		})
		.then(() => {
			res.send('Logged in')
		})
		.catch(err => res.send(err));

}

exports.getProfile = (req, res) => {
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

// Return only sammary. hard code some params for now. Will change it to post and use body to send params. 
exports.getTrophies = (req, res) => {
	const fields = {
		'fields': '@default',
		'npLanguage': 'en',
		'iconSize': 'm',
		'platform': 'PS3,PSVITA,PS4',
		'offset': req.params.start,
		'limit': req.params.limit,
		'comparedUser': req.params.onlineId
	}
	fetch(`${process.env.USER_TROPHY_API}?` + querystring.stringify(fields),
		{
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			},
			redirect: 'follow',
		})
		.then(res => res.json())
		.then(trp => {
			res.json(trp);
		})
}

// check token when service start
exports.checkToken = () => {
	const cert = new Cert;
	cert.getCert(cert => {
		console.log(cert);
		if (cert.refreshToken) {
			refreshToken = cert.refreshToken;
			getaccessToken()
				.then(res => res.json())
				.then(token => {
					accessToken = token.access_token;
					refreshToken = token.refresh_token;
				})
			return true;
		} else {
			return false;
		}
	})
}

//refresh access token hourly
exports.getTokenScheduled = () => {
	return getaccessToken();
}

// test 
exports.getStatus = (req, res) => {
	console.log(accessToken);
	res.send(accessToken + refreshToken);
}


exports.getGames = (req, res) => {

}


getaccessToken = () => {
	return fetch(`${process.env.AUTH_API}oauth/token`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: qs.stringify({
				app_context: 'inapp_ios',
				client_id: process.env.CLIENT_ID,
				client_secret: process.env.CLIENT_SECRET,
				refresh_token: refreshToken,
				duid: process.env.DUID,
				scope: process.env.SCOPE,
				grant_type: 'refresh_token'
			})
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