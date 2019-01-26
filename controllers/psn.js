// at least 2 denpendcies are duplicated, better get rid of them later.
const fetch = require('node-fetch');
const querystring = require('querystring');

const token = require('./psn/tokens');
const Trophylist = require('../models/psn/users/trophylist');

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
	const accessToken = token.getLocalToken();
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


// trophy stuff
getSummary = (offset, comparedUser) => {
	const accessToken = token.getLocalToken();
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
	const accessToken = token.getLocalToken();
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

