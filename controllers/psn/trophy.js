const qs = require('qs');
const request = require('request');

const token = require('./tokens');
const Trophylist = require('../../models/psn/db/trophylist');
const Profile = require('../../models/psn/db/proflie');
const TrophyWorker = require('../../models/psn/db/trophyworker');
const ProfileWorker = require('../../models/psn/db/profileworker');

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

exports.test = async (req, res) => {
	scheduleProfileWorker()
		.then(result => res.send(result))
		.catch(err => console.log(err));
}

// need to change to post method. time gate existing profile to limit the update rate
// currently moving large object between functions, need to sort out it
exports.getAllTrophies = async (req, res) => {
	const accessToken = token.getLocalToken();
	let profile;
	const check = await Profile.findById('Qmx1ZV9HQ0BhOC5oaw==').select('lastUpdateTime -_id');
	// time gate setting. need to be moved to memory cache;
	const timeGate = new Date - check.lastUpdateTime;
	if (check && timeGate != process.env.TIMEGATE) {
		try {
			profile = await getProfile(req.params.onlineId, accessToken);
		}
		catch (err) {
			return res.json({ 'error': 'Network error from PSN' });
		}
		res.json(profile);
		populateProfileWorker(profile.npId, profile.onlineId);
	} else if (!check) {
		try {
			profile = await getProfile(req.params.onlineId, accessToken);
		}
		catch (err) {
			return res.json({ 'error': 'Network error from PSN' });
		}
		res.json(profile);
		populateProfileWorker(profile.npId, profile.onlineId);
	} else {
		res.json({ 'error': `Please wait another ${(process.env.TIMEGATE - timeGate) / 1000} seconds` });
	}
}

createProfile = async (onlineId, accessToken) => {
	let profileNew;
	let games;
	try {
		profileNew = await getProfile(onlineId, accessToken);
		games = await getProfileGames(profileNew.onlineId, accessToken);
	}
	catch (err) {
		return console.log('PSN network error');
	}
	// need to further work on cases when people change onlineId at the same time as processing syncing.
	if (profileNew.onlineId !== onlineId || games === null) {
		return false;
	}
	populateTrophyWorker(games, profileNew.npId, profileNew.onlineId);
	const profile = new Profile;
	return profile.create(games, profileNew);
}

updateProfile = async (onlineId, accessToken) => {
	let profileNew;
	let gamesNew;
	let gamesOld;
	try {
		profileNew = await getProfile(onlineId, accessToken);
		gamesNew = await getProfileGames(profileNew.onlineId, accessToken);
		gamesOld = await Profile.findById(profileNew.npId).select('games');
	} catch (err) {
		return true;
	}
	if (profileNew.onlineId !== onlineId || gamesNew === null) {
		return false;
	}
	// wasting lots of API calls but it's safer and less CPU usage
	gamesOld = gamesOld.games;
	const gamesNewReduce = gamesNew.filter(game => game.progress < 100);
	let needUpdateGames = findDiffGame(gamesNewReduce, gamesOld);
	let needUpdateGames2 = findSameGameNewerTime(gamesNewReduce, gamesOld);
	needUpdateGames = needUpdateGames.concat(needUpdateGames2);
	if (needUpdateGames.length) {
		populateTrophyWorker(needUpdateGames, profileNew.npId, profileNew.onlineId);
	}
	return Profile
		.findById(profileNew.npId)
		.then(profile => profile.update(gamesNew, profileNew))
}

findSameGameNewerTime = (gamesNew, gamesOld) => {
	return gamesNew.filter(gameNew => {
		gamesOld.filter(gameOld => gameOld.npCommunicationId == gameNew.npCommunicationId && gameOld.lastUpdateDate !== gameNew.lastUpdateDate)
	})
}
// background workers for scheduled update profile and trophylist.
exports.scheduleProfileWorker = () => {
	return new Promise((resolve, reject) => {
		ProfileWorker
			.findOne()
			.then(work => {
				if (!work) {
					return resolve(false);
				}
				const accessToken = token.getLocalToken();
				const npId = work.npId;
				const onlineId = work.onlineId;
				Profile
					.findById(npId)
					.then(profile => {
						if (!profile) {
							return createProfile(onlineId, accessToken);
						}
						return updateProfile(onlineId, accessToken);
					})
					.then(result => {
						if (result === false) {
							console.log('profile work failed for user: ', onlineId)
						} else if (result === true) {
							return reject();
						}
						work.delete();
						return resolve(true);
					})
					.catch(err => reject(err));
			})
	})
}

exports.scheduleTrophyWorker = () => {
	return new Promise((resolve, reject) => {
		TrophyWorker
			.findOne()
			.then(async result => {
				if (!result) {
					return resolve(false);
				}
				const accessToken = token.getLocalToken();
				const npCommunicationId = result.npCommunicationId;
				const npId = result.npId;
				const onlineId = result.onlineId;
				// double check user onlineId to make sure there is no mismatch.
				const profileDoubleCheck = await getProfile(onlineId, accessToken);
				const individualGame = await getIndividualGame(npCommunicationId, onlineId, accessToken);
				if (!individualGame.trophies.length || !profileDoubleCheck.npId) {
					return reject('Failed at trophy worker: ' + onlineId);
				}
				if (profileDoubleCheck.npId !== result.npId) {
					TrophyWorker.findByIdAndRemove({ _id: result._id });
					return reject('Failed at trophy worker: ', result.onlineId);
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
								.then(() => {
									TrophyWorker
										.findByIdAndRemove({ _id: result._id })
										.then(() => resolve())
								})
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
								.then(() => {
									TrophyWorker
										.findByIdAndRemove({ _id: result._id })
										.then(() => resolve())
								})
								.catch(err => reject(err));
						}
					})
			})
			.catch(err => reject(err));
	})
}

//add work to workers
populateProfileWorker = (npId, onlineId) => {
	ProfileWorker
		.findOneAndUpdate(
			{
				'npId': npId,
				'onlineId': onlineId
			},
			{
				'npId': npId,
				'onlineId': onlineId
			},
			{
				upsert: true
			}
		)
		.catch(err => console.log(err));
}

populateTrophyWorker = (games, npId, onlineId) => {
	for (let game of games) {
		TrophyWorker
			.findOneAndUpdate(
				{
					'npId': npId,
					'onlineId': onlineId,
					'npCommunicationId': game.npCommunicationId
				},
				{
					'npId': npId,
					'onlineId': onlineId,
					'npCommunicationId': game.npCommunicationId
				},
				{
					upsert: true
				}
			)
			.catch(err => console.log(err));
	}
}

// helper function for update profile.

findDiffGame = (gamesNew, gamesOld) => {
	return gamesNew.filter(gameNew => {
		return !gamesOld.some(gameOld => gameNew.npCommunicationId == gameOld.npCommunicationId)
	})
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

// get data from PSN
getProfileGames = async (onlineId, accessToken) => {
	let start = 0;
	let summary = await getSummary(start, onlineId, accessToken);
	const count = 0 + summary.totalResults;
	let games = summary.trophyTitles;
	if (count > 100) {
		while (start <= count) {
			start += 100;
			await wait(1000)
			summary = await getSummary(start, onlineId, accessToken);
			games = games.concat(summary.trophyTitles);
		}
	}
	// failsafe for not getting any data from PSN
	if (games.length !== count) {
		return null;
	}
	return games.map(game => ({
		'npCommunicationId': game.npCommunicationId,
		'progress': game.comparedUser.progress,
		'earnedTrophies': game.comparedUser.earnedTrophies,
		'lastUpdateDate': game.comparedUser.lastUpdateDate
	}))
}

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

// rate control
wait = ms => {
	return new Promise(resolve => setTimeout(resolve, ms))
}



