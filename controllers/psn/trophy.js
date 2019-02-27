

const token = require('./tokens');
const Trophylist = require('../../models/psn/db/trophylist');
const Profile = require('../../models/psn/db/proflie');
const TrophyWorker = require('../../models/psn/db/trophyworker');
const ProfileWorker = require('../../models/psn/db/profileworker');


createProfile = async (onlineId, accessToken) => {
	let profileNew;
	let games;
	try {
		profileNew = await getProfile(onlineId, accessToken);
		games = await getProfileGames(profileNew.onlineId, accessToken);
	} catch (err) {
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
					TrophyWorker.findByIdAndRemove({
						_id: result._id
					});
					return reject('Failed at trophy worker: ', result.onlineId);
				}
				const smallList = filterList(individualGame.trophies);
				return Trophylist
					.findById(npId)
					.then(trophylist => {
						if (trophylist) {
							const id = trophylist.list.id(npCommunicationId);
							if (id) {
								trophylist.list.id(npCommunicationId).set({
									_id: npCommunicationId,
									trophies: smallList
								});
							} else {
								trophylist.list.push({
									_id: npCommunicationId,
									trophies: smallList
								});
							}
							return trophylist.save().then(() => TrophyWorker.findByIdAndRemove({
								_id: result._id
							}))
						} else {
							trophylistNew = new Trophylist({
								_id: npId,
								list: [{
									_id: npCommunicationId,
									trophies: smallList
								}]
							})
							return trophylistNew.save().then(() => TrophyWorker.findByIdAndRemove({
								_id: result._id
							}))
						}
					})
					.then(() => resolve());
			})
			.catch(err => reject(err));
	})
}


// helper function for update profile.
findDiffGame = (gamesNew, gamesOld) => {
	return gamesNew.filter(gameNew => {
		return !gamesOld.some(gameOld => gameNew.npCommunicationId == gameOld.npCommunicationId)
	})
}
findSameGameNewerTime = (gamesNew, gamesOld) => {
	return gamesNew.filter(gameNew => {
		gamesOld.filter(gameOld => gameOld.npCommunicationId == gameNew.npCommunicationId && gameOld.lastUpdateDate !== gameNew.lastUpdateDate)
	})
}
// filter each list and make the detail minimal
filterList = trophies => {
	return trophies.map(trophy => {
		if (trophy.comparedUser.earned === true) {
			return {
				'earnedDate': trophy.comparedUser.earnedDate
			}
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




