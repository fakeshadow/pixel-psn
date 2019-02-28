const formData = require('form-data');
const request = require('request');
const qs = require('qs');

const token = require('./tokens');
const ThreadDetail = require('../../models/psn/messages/threaddetails');


//get all threads with major detail, used for schedule update
exports.getAllThreades = () => {
	return new Promise((resolve, reject) => {
		const accessToken = token.getLocalToken();
		oldThreads(accessToken)
			.then(threads => threads.map(thread => ({
				'threadId': thread.threadId
			})))
			.then(async (threadIds) => {
				ThreadDetail.clear();
				for (let id of threadIds) {
					const detail = await detailThread(id.threadId, 1, accessToken); //count could be adjusted. 
					const threadDetail = new ThreadDetail(detail.threadMembers, detail.threadEvents, detail.threadId, detail.threadModifiedDate);
					threadDetail.save();
				}
				resolve();
			})
			.catch(err => reject(err));
	})
}

exports.getThreadsModifiedDate = (req, res) => {
	res.json(ThreadDetail.getThreadsModifiedDate());
}

exports.crossFindId = (req, res) => {
	if (!req.body.threadId && req.body.onlineId) {
		res.json(ThreadDetail.findThreadId(req.body.onlineId))
	} else if (req.body.threadId && !req.body.onlineId) {
		res.json(ThreadDetail.findOnlineId(req.body.threadId))
	} else {
		res.json('error: wrong request');
	}
}

exports.getThreadMessages = (req, res) => {
	const accessToken = token.getLocalToken();
	if (req.body.count > 100) {
		return res.json('error: please reduce count')
	}
	detailThread(req.body.threadId, req.body.count, accessToken)
		.then(thread => res.json(thread))
		.catch(err => res.json(err));
}


exports.sendMessageToThread = (req, res) => {
	const accessToken = token.getLocalToken();
	// image size has ridiculous limit. need look into.
	sendMessage(req, accessToken, null)
		.then(result => res.send(result))
		.catch(err => res.send(err));
}

// Use auto update cache for checking existing threads. It could introduce some error but will some api calls
exports.sendMessageToPerson = (req, res) => {
	const accessToken = token.getLocalToken();
	const checkId = ThreadDetail.findThreadId(req.body.onlineId)
	if (checkId.length > 0) {
		return res.json('error: already get threads');
	}
	newThread(req.body.onlineId, accessToken)
		.then(threadId => {
			sendMessage(req, accessToken, threadId)
				.then(result => res.send(result))
				.catch(err => res.send(err));
		})
		.catch(err => res.send(err));
}
