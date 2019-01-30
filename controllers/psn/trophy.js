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
	// Trophylist
	// 	.findById('Qmx1ZV9HQ0BhOC5oaw==')
	// 	.then(trophylist => {
	// 		// if (trophylist.length) {
	// 		// 	trophylist.list.id('Blue_GC').set({ 'trophies': [1, 2, 3, 4] })
	// 		// 	return trophylist.save();
	// 		// }
	// 		trophylist.list.push({ _id: 'testtest', trophies: [5, 6, 7, 8, 9] })
	// 		return trophylist.save()
	// 	})
	// 	.then(result => console.log(result))
	// 	.catch(err => console.log(err))
}


// need to change to post method. time gate existing profile to limit the update rate
// currently moving large object between functions, need to sort out it
exports.getAllTrophies = async (req, res) => {
	const accessToken = token.getLocalToken();

	// time gate here

	let profileNew;
	let profileExisted;
	try {
		profileNew = await getProfile(req.params.onlineId, accessToken);
		profileExisted = await Profile.findById({ _id: profileNew.npId });
	}
	catch (err) {
		res.json({ 'error': 'Databse error' });
	}
	if (profileExisted) {
		res.json(profileNew);
		updateProfile(req, profileNew, profileExisted, accessToken);
	} else {
		res.json(profileNew);
		createProfile(req, profileNew, accessToken);
	}
}

updateProfile = async (req, profileNew, profileExisted, accessToken) => {
	console.log('Starting update profile')
	let start = 0;
	let gamesOld = profileExisted.games;
	let summary = await getSummary(start, req.params.onlineId, accessToken);
	const count = summary.totalResults;
	let gamesNew = summary.trophyTitles;
	if (count > 100) {
		while (start <= count) {
			start += 100;
			await wait(2000)
			summary = await getSummary(start, req.params.onlineId, accessToken);
			gamesNew = gamesNew.concat(summary.trophyTitles);
		}
	}
	if (gamesNew.length !== count) {

		// need add an failsafe function
		console.log('failed at games count :' + gamesNew.length + '/' + count);
		return false;
	}
	gamesNew = gamesNew.map(game => ({
		'npCommunicationId': game.npCommunicationId,
		'progress': game.comparedUser.progress,
		'earnedTrophies': game.comparedUser.earnedTrophies,
		'lastUpdateDate': game.comparedUser.lastUpdateDate
	}))

	// find new list and same list with newer last update date. concat them and save it into trophy update schedule.
	let needUpdateGames = findDiffGame(gamesNew, gamesOld);
	let needUpdateGames2 = findSameGameNewerTime(gamesNew, gamesOld);
	console.log(needUpdateGames.length);
	console.log(needUpdateGames2.length);
	needUpdateGames = needUpdateGames.concat(needUpdateGames2);
	needUpdateGames = needUpdateGames.map(game => ({
		'npId': profileNew.npId,
		'onlineId': profileNew.onlineId,
		'npCommunicationId': game.npCommunicationId
	}))
	if (needUpdateGames.length) {
		console.log('start saving into schedule');
		for (let needUpdateGame of needUpdateGames) {
			Schedule
				.findOneAndUpdate(
					{
						'npId': profileNew.npId,
						'onlineId': profileNew.onlineId,
						'npCommunicationId': needUpdateGame.npCommunicationId
					},
					{
						'npId': profileNew.npId,
						'onlineId': profileNew.onlineId,
						'npCommunicationId': needUpdateGame.npCommunicationId
					},
					{
						upsert: true
					}
				)
				.catch(err => console.log(err));
		}
	}

	// concat new with old and cut duplicated lists(will save the duplicated list with newer lastUpdateTime).
	games = gamesNew.concat(gamesOld);
	games = cutDuplicate(games);
	console.log('start updating profile');
	Profile
		.updateOne(
			{
				_id: profileNew.npId
			},
			{
				onlineId: profileNew.onlineId,
				avatarUrl: profileNew.avatarUrl,
				games: games,
				trophySummary: profileNew.trophySummary,
				lastUpdateTime: new Date
			}
		)
		.then(result => console.log(result)).catch(err => console.log(err));
}

createProfile = async (req, profileNew, accessToken) => {
	let start = 0;
	let summary = await getSummary(start, req.params.onlineId, accessToken);
	const count = summary.totalResults;
	let games = summary.trophyTitles;
	if (count > 100) {
		while (start <= count) {
			start += 100;
			await wait(2000)
			summary = await getSummary(start, req.params.onlineId, accessToken);
			games = games.concat(summary.trophyTitles);
		}
	}
	if (games.length !== count) {
		console.log('failed at games count :' + gamesNew.length + '/' + count);
		return false;
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
	for (let game of games) {
		Schedule
			.findOneAndUpdate(
				{
					'npId': profileNew.npId,
					'onlineId': profileNew.onlineId,
					'npCommunicationId': game.npCommunicationId
				},
				{
					'npId': profileNew.npId,
					'onlineId': profileNew.onlineId,
					'npCommunicationId': game.npCommunicationId
				},
				{
					upsert: true
				}
			)
			.catch(err => console.log(err));
	}
}

// schedule job for updating trophy list. find any result from Schedules collection and start an sync process. 
exports.trophyWorker = () => {
	return new Promise((resolve, reject) => {
		Schedule
			.findOne()
			.then(async (result) => {
				if (!result) {
					return resolve(false);
				}
				const accessToken = token.getLocalToken();
				const npCommunicationId = result.npCommunicationId;
				const npId = result.npId;
				const onlineId = result.onlineId;
				let individualGame;
				console.log('check working point at get individualGame')
				individualGame = await getIndividualGame(npCommunicationId, onlineId, accessToken);
				if (!individualGame.trophies.length) {
					return reject(individualGame);
				}
				const smallList = filterList(individualGame.trophies);
				return Trophylist
					.findById(npId)
					.then(trophylist => {
						if (trophylist) {
							const id = trophylist.list.id(npCommunicationId);
							if (id) {
								trophylist.list.id(npCommunicationId).set({ _id: npCommunicationId, trophies: smallList });
							} else {
								trophylist.list.push({ _id: npCommunicationId, trophies: smallList });
							}
							trophylist
								.save()
								.then(() => Schedule.findByIdAndRemove({ _id: result._id }))
								.catch(err => reject(err));
						} else {
							trophylistNew = new Trophylist(
								{
									_id: npId,
									list: [{ _id: npCommunicationId, trophies: smallList }]
								}
							)
							trophylistNew
								.save()
								.then(() => Schedule.findByIdAndRemove({ _id: result._id }))
								.catch(err => reject(err));
						}
					})
			})
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
cutDuplicate = games => {
	for (let i = 0; i < games.length; i++) {
		for (let j = i + 1; j < games.length; j++) {
			if (games[i].npCommunicationId === games[j].npCommunicationId) {
				games.splice(j--, 1);
			}
		}
	}
	return games
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
				reject(JSON.parse(err));
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


