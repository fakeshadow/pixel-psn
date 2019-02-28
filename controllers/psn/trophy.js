
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



