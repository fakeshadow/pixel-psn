// at least 2 denpendcies are duplicated, better get rid of them later.
const fetch = require('node-fetch');
const request = require('superagent');

const qs = require('qs');
const querystring = require('querystring');
const formData = require('form-data');


const Cert = require('../models/psn/certs');
const Profile = require('../models/psn/users/profiles');
const Trophylist = require('../models/psn/users/trophylist');

require('dotenv').config();

let accessToken;
let refreshToken;
let myId;

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
			const cert = new Cert(refreshToken);
			return cert.save();
		})
		.then(() => {
			res.send('Logged in')
		})
		.catch(err => res.send(err));

}

// need to work out the fields
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
			const profile = new Profile(pro.onlineId, pro.npId, pro.avatarUrl, pro.aboutMe, pro.plus, pro.trophySummary);
			profile.save();
			res.json(pro);
		})
}

// Return only summary. hard code some params for now. Will change it to post and use body to send params. 
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

exports.getIndividualGame = (req, res) => {
	const fields = {
		'fields': '@default,trophyRare,trophyEarnedRate',
		'npLanguage': 'en',
		'comparedUser': req.params.onlineId
	}
	fetch(`${process.env.USER_TROPHY_API}/${req.params.npCommunicationId}/trophyGroups/all/trophies?` + querystring.stringify(fields),
		{
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			},
			redirect: 'follow',
		})
		.then(response => response.json())
		.then(trp => res.json(trp))
		.catch(err => res.send(err));
}

// currently very slow. Need to find a work around.
exports.getAllTrophies = (req, res) => {
	let start = 1;
	let count;
	getSummary(start, req.params.onlineId)
		.then(res => res.json())
		.then(summary => {
			res.send('Request is sent. Please check result later with /trophies/result')
			count = summary.totalResults;
			summary.trophyTitles.map(list => {
				const trophylist = new Trophylist(list.npCommunicationId, list.comparedUser);
				return trophylist.save();
			})
		})
		.then(async () => {
			if (count <= 100) {
				return;
			} else {
				while (start <= count) {
					start += 100;
					await getSummary(start, req.params.onlineId)
						.then(res => res.json())
						.then(summary => {
							summary.trophyTitles.map(list => {
								const trophylist = new Trophylist(list.npCommunicationId, list.comparedUser);
								return trophylist.save();
							})
						})
				}
			}
		})
		.then(async () => {
			const lists = Trophylist.fetchAllList();
			for (let l of lists) {
				await wait(req.params.waitTime);
				await getIndividualGame(l.npCommunicationId, req.params.onlineId)
					.then(res => res.json())
					.then(res => Trophylist.saveDetail(res))
			}
		})
		.catch(err => console.log(err));
}

exports.checkAllTrophies = (req, res) => {
	Trophylist.fetchAllDetail(result => res.json(result));
}

// social stuff
exports.formThread = (req, res) => {
	const body = {
		"threadDetail": {
			"threadMembers": [
				{ "onlineId": req.body.id },
				{ "onlineId": myId }
			]
		}
	};	
	request.post(`${process.env.MESSAGE_THREAD_API}threads/`)
		.http2()
		//.accept('application/json')
		.field('threadDetail', JSON.stringify(body), { 'Content-Type': 'application/json; charset=utf-8' })
		.set('Authorization', `Bearer ${accessToken}`)
		.then(response => {
			res.send(response)
		})
		.catch(err => {
			console.log(err)
			res.send(err)
		});
}

// send message




// check token when service start
exports.checkToken = (callback) => {
	const cert = new Cert();
	cert.getCert(cert => {
		console.log(cert);
		if (cert.refreshToken) {
			refreshToken = cert.refreshToken;
			getaccessToken();
			callback(true);
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


exports.getGames = (req, res) => {

}



// trophy stuff
getSummary = (offset, comparedUser) => {
	const fields = {
		'fields': '@default',
		'npLanguage': 'en',
		'iconSize': 'm',
		'platform': 'PS3,PSVITA,PS4',
		'offset': offset,
		'limit': 100,
		'comparedUser': comparedUser
	}
	return fetch(`${process.env.USER_TROPHY_API}?` + querystring.stringify(fields),
		{
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			},
			redirect: 'follow',
		})
}

async function getIndividualGame(npCommunicationId, comparedUser) {
	const fields = {
		'fields': '@default,trophyRare,trophyEarnedRate',
		'npLanguage': 'en',
		'comparedUser': comparedUser
	}
	return fetch(`${process.env.USER_TROPHY_API}/${npCommunicationId}/trophyGroups/all/trophies?` + querystring.stringify(fields),
		{
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			},
			redirect: 'follow',
		})
}

// rate control,need tuning for better result
wait = ms => {
	return new Promise(resolve => setTimeout(resolve, ms))
}

// Certification stuff
getaccessToken = () => {
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
				refresh_token: refreshToken,
				duid: process.env.DUID,
				scope: process.env.SCOPE,
				grant_type: 'refresh_token'
			})
		})
		.then(res => res.json())
		.then(token => {
			accessToken = token.access_token;
			return refreshToken = token.refresh_token;
		})
		.catch(err => res.send(err))
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