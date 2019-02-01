const qs = require('qs');
const request = require('request');

const token = require('./tokens');
const Trophylist = require('../../models/psn/db/trophylist');
const Profile = require('../../models/psn/db/proflie');
const Schedule = require('../../models/psn/db/schedule');


// Return all games if the profile is already in database. Else it will show the recently games according to start and limit params.
exports.getTrophies = (req, res) => {
	Profile
		.findOne({ onlineId: req.params.onlineId })
		.then(profile => {
			if (profile) {
				return res.json(profile);
			}
			const accessToken = token.getLocalToken();
			return getSummary(req.params.limit, req.params.onlineId, accessToken)
				.then(result => res.json(result))
		})
		.catch(err => res.json(err));
}

exports.getIndividualGame = (req, res) => {
	const accessToken = token.getLocalToken();
	Trophylist
		.findById(req.params.npId)
		.then(list => {
			const result = list.list.id(req.params.npCommunicationId);
			if (result) {
				return res.json(result);
			}
			return getIndividualGame(req.params.npCommunicationId, req.params.onlineId, accessToken)
				.then(result => res.json(result));

		})
		.catch(err => res.json(err));
}

exports.test = (req, res) => {
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
		return res.json({ 'error': 'Can not get profile Data' });
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
	needUpdateGames = needUpdateGames.concat(needUpdateGames2);
	needUpdateGames = needUpdateGames.map(game => ({
		'npId': profileNew.npId,
		'onlineId': profileNew.onlineId,
		'npCommunicationId': game.npCommunicationId
	}))
	if (needUpdateGames.length) {
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
		.catch(err => console.log(err));
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
				individualGame = await getIndividualGame(npCommunicationId, onlineId, accessToken);
				if (!individualGame.trophies.length) {
					return reject(npCommunicationId);
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
	return games;
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



