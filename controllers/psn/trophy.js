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
	Schedule.find().then(resp => console.log(resp))
}


// need to change to post method. time gate existing profile to limit the update rate
// currently moving large object between functions, need to sort out it
exports.getAllTrophies = async (req, res) => {
	const accessToken = token.getLocalToken();
	const profileExisted = await Profile.findOne({ 'onlineId': req.params.onlineId });
	if (profileExisted) {
		const profileNew = await getProfile(req.params.onlineId, accessToken);
		res.json(profileNew);
		updateProfile(req, profileNew, profileExisted, accessToken);
		// } else if (profileExisted && time) {
		// 	res.json(profileExisted);
	} else {
		const profileNew = await getProfile(req.params.onlineId, accessToken);
		res.json(profileNew);
		createProfile(req, profileNew, accessToken);
	}
}

// main aim is to have minimal api calls and database I/O.
updateProfile = async (req, profileNew, profileExisted, accessToken) => {
	let start = 0;
	let gamesOld = profileExisted.games;
	let summary = await getSummary(start, req.params.onlineId, accessToken);
	// const count = summary.totalResults;
	let games = summary.trophyTitles;
	games = games.map(game => ({
		'npCommunicationId': game.npCommunicationId,
		'progress': game.comparedUser.progress,
		'earnedTrophies': game.comparedUser.earnedTrophies,
		'lastUpdateDate': game.comparedUser.lastUpdateDate
	}))

	// load more summarys until the same game with same last update date appear
	let gamesNew = games;
	let same = findSameGameSameTime(games, gamesOld);
	while (same.length !== games.length) {
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
		gamesNew = gamesNew.concat(games);
		same = findSameGameSameTime(games, gamesOld);
	}

	// find new list and same list with newer last update date. concat them and save it into trophy update schedule.
	let needUpdateGames = findDiffGame(gamesNew, gamesOld);
	let needUpdateGames2 = findSameGameNewerTime(gamesNew, gamesOld);
	needUpdateGames = needUpdateGames.concat(needUpdateGames2);
	needUpdateGames = needUpdateGames.map(game => ({
		'npId': profileExisted._id,
		'onlineId': profileNew.onlineId,
		'npCommunicationId': game.npCommunicationId
	}))

	if (needUpdateGames.length) {
		// need to add function for filter schedule
		schedule.updateMany(needUpdateGames, { upsert: true }).catch(err => console.log(err))
	}

	// concat new with old and cut duplicated lists(will save the duplicated list with newer lastUpdateTime).
	games = gamesNew.concat(gamesOld);
	games = cutDuplicate(games);
	Profile
		.updateOne(
			{
				_id: profileExisted._id
			},
			{
				onlineId: profileNew.onlineId,
				avatarUrl: profileNew.avatarUrl,
				games: games,
				trophySummary: profileNew.trophySummary,
				lastUpdateTime: new Date
			})
		.then(result => console.log(result)).catch(err => console.log(err));
}


createProfile = async (req, profileNew, accessToken) => {
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
		_id: profileNew.npId,
		onlineId: profileNew.onlineId,
		region: profileNew.region,
		avatarUrl: profileNew.avatarUrl,
		games: games,
		trophySummary: profileNew.trophySummary,
		// blockchainId for future implement
		blockChainId: null,
		lastUpdateTime: new Date
	})
	profile.save().catch(err => console.log(err));
	// await wait(req.params.waitTime);
	// for (let game of games) {
	// 	try {
	// 		await wait(req.params.waitTime)
	// 		const individualGame = await getIndividualGame(game.npCommunicationId, req.params.onlineId, accessToken);
	// 		const smallList = filterList(individualGame.trophies);
	// 		alteredList.push({ 'npCommunicationId': game.npCommunicationId, 'trophies': smallList })
	// 	} catch (err) {
	// 		console.log(err);
	// 	}
	// }
	// const trophylist = new Trophylist({
	// 	_id: profileTemp.npId,
	// 	lists: alteredList,
	// })
	// trophylist.save().catch(err => console.log(err));
}


exports.checkAllTrophies = (req, res) => {
	Trophylist.fetchAllDetail(result => res.json(result));
}


// schedule job for updating trophy list. find any result from Schedules collection and start an sync process. 
exports.trophyWorker = () => {
	return new Prmoise((resolve, reject) => {
		Schedule
			.find()
			.then(result => {
				if (!result.length) {
					return resolve(false);
				}
				return result;
			})
			.then(async (result) => {
				const accessToken = token.getLocalToken();
				const npCommunicationId = result.npCommunicationId;
				const npId = result.npId;
				const onlineId = result.onlineId;
				let individualGame;
				try {
					individualGame = await getIndividualGame(npCommunicationId, onlineId, accessToken);
				} catch (err) {
					return reject(err);
				}
				const smallList = filterList(individualGame.trophies);
				alteredList.push({ 'npCommunicationId': game.npCommunicationId, 'trophies': smallList })
				Schedule.findByIdAndRemove({ _id: result._id })
					.then(() => {
						return Trophylist.updateOne({ _id: npId }, { lists: alteredList }, { upert: true })
					})
					.catch(err => reject(err));

			})
			.then(result => resolve(result))
			.catch(err => reject(err));
	})
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


