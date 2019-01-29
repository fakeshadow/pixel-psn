const qs = require('qs');
const request = require('request');

const token = require('./tokens');
const Trophylist = require('../../models/psn/db/trophylist');
const Profile = require('../../models/psn/db/proflie');
const Schedule = require('../../models/psn/db/schedule');

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

exports.test = (req, res) => {
	// // Profile.findById(req.params.npId).then(result => res.json(result));
	// const id = 'Qmx1ZV9HQ0BhOC5oaw=='
	// Profile.findById(id, 'games')
	// .select("games.npCommunicationId games.lastUpdateDate").then(result => res.json(result))
	let a = [
		{
			"npCommunicationId": "NPWR11424_00",
			"lastUpdateDate": "2019-01-28T12:10:07Z"
		},
		{
			"npCommunicationId": "NPWR13872_00",
			"lastUpdateDate": "2018-11-24T03:54:58Z"
		},
		{
			"npCommunicationId": "NPWR11332_00",
			"lastUpdateDate": "2018-11-07T05:24:53Z"
		},
		{
			"npCommunicationId": "NPWR11469_00",
			"lastUpdateDate": "2018-11-03T11:28:08Z"
		}]

	let b = [
		{
			"npCommunicationId": "NPWR13872_00",
			"lastUpdateDate": "2018-11-24T02:54:58Z"
		},
		{
			"npCommunicationId": "NPWR11332_00",
			"lastUpdateDate": "2018-11-07T05:24:53Z"
		},
		{
			"npCommunicationId": "NPWR11469_00",
			"lastUpdateDate": "2018-11-03T10:28:08Z"
		},
		{
			"npCommunicationId": "NPWR12800_00",
			"lastUpdateDate": "2018-10-23T07:52:27Z"
		},
		{
			"npCommunicationId": "NPWR11704_00",
			"lastUpdateDate": "2018-10-06T12:40:42Z"
		}
	]


	let k = findSameGameSameTime(a, b);
	console.log(k.length);
	res.json(k);
}


// function for update profile. there must be a better way to do it but i'm suck at math.
findSameGameNewerTime = (gamesNew, gamesOld) => {
	return gamesNew.filter(gameNew => {
		for (let gameOld of gamesOld) {
			if (gameOld.npCommunicationId == gameNew.npCommunicationId && gameOld.lastUpdateDate !== gameNew.lastUpdateDate) {
				return gameOld;
			}
		}
	})
}
findSameGameSameTime = (gamesNew, gamesOld) => {
	return gamesNew.filter(gameNew => {
		for (let gameOld of gamesOld) {
			if (gameOld.npCommunicationId == gameNew.npCommunicationId && gameOld.lastUpdateDate == gameNew.lastUpdateDate) {
				return gameOld;
			}
		}
	})
}
findDiffGame = (gamesNew, gamesOld) => {
	return gamesNew.filter(gameNew => {
		return !gamesOld.some(gameOld => gameNew.npCommunicationId == gameOld.npCommunicationId)
	})
}
cutDuplicate = k => {
	for (let i = 0; i < k.length; i++) {
		for (let j = i + 1; j < k.length; j++) {
			if (k[i].npCommunicationId === k[j].npCommunicationId) {
				k.splice(j--, 1);
			}
		}
	}
	return k
}


// need to change to post method. time gate existing profile to limit the update rate
// currently moving large object between functions, need to sort out it
exports.getAllTrophies = async (req, res) => {
	const accessToken = token.getLocalToken();
	const profileExisted = await Profile.findOne({'onlineId': req.params.onlineId});
	// if (profileExisted && time) {
		//const profileTemp = await getProfile(req.params.onlineId, accessToken);
		res.json(profileExisted);
		updateProfile(req, profileExisted, accessToken);
	// } else if (profileExisted && time) {
	// 	res.json(profileExisted);
	// } else {
	// 	const profileTemp = await getProfile(req.params.onlineId, accessToken);
	// 	res.json(profileTemp);
	// 	createProfile(req, profileTemp, accessToken);
	// }
}

// main aim is to have minimal api calls and database I/O. 
updateProfile = async (req, profileExisted, accessToken) => {
	let start = 0;
	let gamesOld = profileExisted.games;
	let summary = await getSummary(start, req.params.onlineId, accessToken);
	let games = summary.trophyTitles;
	games = games.map(game => ({
		'npCommunicationId': game.npCommunicationId,
		'progress': game.comparedUser.progress,
		'earnedTrophies': game.comparedUser.earnedTrophies,
		'lastUpdateDate': game.comparedUser.lastUpdateDate
	}))
	// load more summarys until the same game with same last update date appear
	let gamesNew = [];
	gamesNew.concat(games);
	let same = findSameGameSameTime(games, gamesOld);

	while (same.length === 0) {
		start += 100;
		await wait(req.params.waitTime);
		summary = await getSummary(start, req.params.onlineId, accessToken);
		games = summary.trophyTitles;
		games = games.map(game => ({
			'npCommunicationId': game.npCommunicationId,
			'progress': game.comparedUser.progress,
			'earnedTrophies': game.comparedUser.earnedTrophies,
			'lastUpdateDate': game.comparedUser.lastUpdateDate
		}))
		gamesNew.concat(games);
		same = findSameGameSameTime(games, gamesOld);
	}
	// find new list and same list with newer last update date. concat them and save it into trophy update schedule.
	let needUpdateGames = findDiffGame(gamesNew, gamesOld);
	let needUpdateGames2 = findSameGameNewerTime(gamesNew, gamesOld);
	needUpdateGames = needUpdateGames.concat(needUpdateGames2);
	needUpdateGames = needUpdateGames.map(game => ({
		'npCommunicationId': game.npCommunicationId
	}))

	if (needUpdateGames.length) {
		const schedule = new Schedule({
			_id: profileExisted.npId,
			games: needUpdateGames
		})
		// need to add function for filter schedule
		schedule.findOneAndUpdate({ id: profileExisted.npId }, { upsert: true }).catch(err => console.log(err))
	}
	
	// concat new with old and cut duplicated lists(will save the duplicated list with newer lastUpdateTime).
	games = gamesNew.concat(gamesOld);
	games = cutDuplicate(games);
	Profile.findOneAndReplace({ _id: profileExisted.npId }, { 'games': games }).catch(err => console.log(err))
}


createProfile = async (req, profileTemp, accessToken) => {
	let start = 0;
	let alteredList = [];
	let summary = await getSummary(start, req.params.onlineId, accessToken);
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
	games = games.map(game => ({
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
		// blockchainId for future implement
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
getSummary = (offset, onlineId, accessToken) => {
	return new Promise((resolve, reject) => {
		const fields = {
			'fields': '@default',
			'npLanguage': 'en',
			'iconSize': 'm',
			'platform': 'PS3,PSVITA,PS4',
			'offset': offset,
			'limit': 100,
			'comparedUser': onlineId
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


