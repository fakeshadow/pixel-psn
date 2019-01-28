const qs = require('qs')
const token = require('./psn/tokens');
const Trophylist = require('../models/psn/db/trophylist');
const request = require('request');

const Profile = require('../models/psn/db/proflie');

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
	request.get({
		url: `${process.env.USER_TROPHY_API}?` + qs.stringify(fields),
		auth: {
			'bearer': `${accessToken}`
		}
	}, (err, response, body) => {
		if (err) {
			res.json(err);
		} else {
			res.json(JSON.parse(body));
		}
	})
}

exports.getIndividualGame = (req, res) => {
	const accessToken = token.getLocalToken();
	const fields = {
		'fields': '@default,trophyRare,trophyEarnedRate',
		'npLanguage': 'en',
		'comparedUser': req.params.onlineId
	}
	request.get({
		url: `${process.env.USER_TROPHY_API}/${req.params.npCommunicationId}/trophyGroups/all/trophies?` + qs.stringify(fields),
		auth: {
			'bearer': `${accessToken}`
		}
	}, (err, response, body) => {
		if (err) {
			res.json(err);
		} else {
			res.json(JSON.parse(body));
		}
	})
}

// currently very slow. Need to find a work around.

// need to change to post method. 

exports.getAllTrophies = async (req, res) => {
	const accessToken = token.getLocalToken();
	let start = 0;
	let alteredList = [];

	// construct a new profile //
	const profileTemp = await getProfile(req.params.onlineId, accessToken);
	let summary = await getSummary(start, req.params.onlineId, accessToken);
	res.json(profileTemp);
	const count = summary.totalResults;
	let games = summary.trophyTitles;
	if (count > 100) {
		while (start <= count) {
			start += 100;
			await wait(req.params.waitTime);
			summary = await getSummary(start, req.params.onlineId, accessToken);
			games = games.concat(summary.trophyTitles);
		}
	}
	games = await games.map(game => ({
		'npCommunicationId': game.npCommunicationId,
		'progress': game.comparedUser.progress,
		'earnedTrophies': game.comparedUser.earnedTrophies,
		'lastUpdateDate': game.comparedUser.lastUpdateDate
	}))
	const profile = new Profile({
		_id: profileTemp.npId,
		onlineId: profileTemp.onlineId,
		region: profileTemp.region,
		avatarUrl: profileTemp.avatarUrl,
		games: games,
		trophySummary: profileTemp.trophySummary,
		blockChainId: null,
		lastUpdateTime: new Date
	})
	profile.save().catch(err => console.log(err));
	await wait(req.params.waitTime);
	for (let game of games) {
		try {
			await wait(req.params.waitTime)
			const individualGame = await getIndividualGame(game.npCommunicationId, req.params.onlineId, accessToken);
			const smallList = filterList(individualGame.trophies);
			console.log(smallList);
			console.log(alteredList.length);
			alteredList.push({ 'npCommunicationId': game.npCommunicationId, 'trophies': smallList })
		} catch (err) {
			console.log(err);
		}
	}
	const trophylist = new Trophylist({
		_id: profileTemp.npId,
		lists: alteredList,
	})
	trophylist.save().catch(err => console.log(err));
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
			url: `${process.env.USERS_API}${onlineId}/profile?` + qs.stringify(fields),
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

getIndividualGame = (npCommunicationId, onlineId, accessToken) => {
	return new Promise((resolve, reject) => {
		const fields = {
			'fields': '@default,trophyRare,trophyEarnedRate',
			'npLanguage': 'en',
			'comparedUser': onlineId
		}
		request.get({
			url: `${process.env.USER_TROPHY_API}/${npCommunicationId}/trophyGroups/all/trophies?` + qs.stringify(fields),
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

// rate control,need tuning for better result
wait = ms => {
	return new Promise(resolve => setTimeout(resolve, ms))
}

// filter each list and make the detail minimal
filterList = trophies => {
	return trophies.map(trophy => {
		if (trophy.comparedUser.earned === true) {
			return { 'earnedDate': trophy.comparedUser.earnedDate }
		} else {
			return {}
		}
	})
}


