const fetch = require('node-fetch');
const qs = require('qs')
const token = require('./psn/tokens');
const Trophylist = require('../models/psn/users/trophylist');
const request = require('request');

const profile = require('../models/psn/db/proflie');

require('dotenv').config();


// Return only summary. hard code some params for now. Will change it to post and use body to send params. 
exports.getTrophies = (req, res) => {
	const accessToken = token.getLocalToken();
	const fields = {
		'fields': '@default',
		'npLanguage': 'en',
		'iconSize': 'm',
		'platform': 'PS3,PSVITA,PS4',
		'offset': req.params.start,
		'limit': req.params.limit,
		'comparedUser': req.params.onlineId
	}
	fetch(`${process.env.USER_TROPHY_API}?` + qs.stringify(fields),
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
	const accessToken = token.getLocalToken();
	const fields = {
		'fields': '@default,trophyRare,trophyEarnedRate',
		'npLanguage': 'en',
		'comparedUser': req.params.onlineId
	}
	fetch(`${process.env.USER_TROPHY_API}/${req.params.npCommunicationId}/trophyGroups/all/trophies?` + qs.stringify(fields),
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

// need to change to post method.   basic flow:  check cache => check last update time => update profile => update game list => update games
//																										 => update profile cache

exports.getAllTrophies = (req, res) => {
	const accessToken = token.getLocalToken();
	let start = 0;
	let count;
	getSummary(start, req.params.onlineId, accessToken)
		.then(summary => {
			res.send('Request is sent. Please check result later with /trophies/result')
			count = summary.totalResults;
			summary.trophyTitles.map(list => {
				const user = new user(npId, onlineId, games, blockChainId)
				user.save();
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
					await getSummary(start, req.params.onlineId, accessToken)
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
			const npId = await checkAccountId(req.params.onlineId);
			for (let l of lists) {
				await wait(req.params.waitTime);
				await getIndividualGame(l.npCommunicationId, req.params.onlineId)
					.then(res => res.json())
					.then(async (res) => {
						const smallList = await filterList(res.trophies);
						Trophylist.saveDetail({ 'n': l.npCommunicationId, 'u': npId, 't': smallList })
					})
			}
		})
		.catch(err => console.log(err));
}

exports.checkAllTrophies = (req, res) => {
	Trophylist.fetchAllDetail(result => res.json(result));
}


// trophy stuff

getSummary = (offset, comparedUser, accessToken) => {
	return new Promise((resolve, reject) => {
		const fields = {
			'fields': '@default',
			'npLanguage': 'en',
			'iconSize': 'm',
			'platform': 'PS3,PSVITA,PS4',
			'offset': offset,
			'limit': 100,
			'comparedUser': comparedUser
		}
		request.get({
			url: `${process.env.USER_TROPHY_API}?` + qs.stringify(fields),
			auth: {
				'bearer': `${accessToken}`
			}
		}, (err, response, body) => {
			if (err) {
				reject(err);
			} else {
				resolve(JSON.parse(body));
			}
		})
	})
}

getProfile = (onlineId, accessToken) => {
	return new Promise((resolve, reject) => {
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
				reject(JSON.parse(err));
			} else {
				resolve(JSON.parse(body));
			}
		})
	})
}



getIndividualGame = async (npCommunicationId, comparedUser) => {
	const accessToken = token.getLocalToken();
	const fields = {
		'fields': '@default,trophyRare,trophyEarnedRate',
		'npLanguage': 'en',
		'comparedUser': comparedUser
	}
	return await fetch(`${process.env.USER_TROPHY_API}/${npCommunicationId}/trophyGroups/all/trophies?` + qs.stringify(fields),
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


// filter each list and make the detail minimal
filterList = async (trophies) => {
	return await trophies.map(trophy => {
		if (trophy.comparedUser.earned === true) {
			return { 'd': trophy.comparedUser.earnedDate }
		} else {
			return {}
		}
	})
}

// recheck user's npId and replace the onlineId
checkAccountId = onlineId => {
	return new Promise((resolve, reject) => {
		const accessToken = token.getLocalToken();
		const fields = {
			'fields': '@default,relation,requestMessageFlag,presence,@personalDetail,trophySummary',
		}
		request.get({
			url: `${process.env.USERS_API}${onlineId}/profile?` + qs.stringify(fields),
			auth: {
				'bearer': `${accessToken}`
			}
		}, (err, response, body) => {
			if (err) {
				reject(err);
			} else {
				resolve(JSON.parse(body).npId);
			}
		})
	})
}

