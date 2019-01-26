const formData = require('form-data');
const request = require('request');
const fetch = require('node-fetch');
const querystring = require('querystring');

const token = require('./tokens');
const ThreadDetail = require('../../models/psn/messages/threaddetails');

require('dotenv').config();


//get all threads with major detail, used for schedule update
exports.getAllThreades = () => {
	return new Promise((resolve, reject) => {
		const accessToken = token.getLocalToken();
		oldThreads(accessToken)
			.then(threads => threads.map(thread => ({ 'threadId': thread.threadId })))
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

exports.leaveThread  = (req, res) => {
	const accessToken = token.getLocalToken();
	const threadId = req.body.threadId
	fetch(`${process.env.MESSAGE_THREAD_API}threads/${threadId}/users/me`, 
	{
		method: 'DELETE',
		headers: {
			'Authorization': `Bearer ${accessToken}`
		},
		redirect: 'follow',
	})
	.then(() => res.send('Done'))
	.catch(err => res.send(err))	
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

// threadIdNew input is optional for case like setuping up a new thread and send message directly after
sendMessage = (req, accessToken, threadIdNew) => {
	let threadId;
	if (threadIdNew) {
		threadId = threadIdNew
	} else {
		threadId = req.body.threadId
	}
	if (req.body.type == '1') {
		// need to import message check to filter dirty words,strings, etc.
		// need to import threadId check to reject wrong id.
		return sendText(threadId, req.body.message, accessToken);
	} else if (req.body.type == '2') {
		return sendImage(threadId, req.body.message, req.files.content[0].buffer, accessToken);
	} else console.log('wrong type');
}

// message stuff
sendText = (threadId, message, accessToken) => {
	return new Promise((resolve, reject) => {
		const body = {
			"messageEventDetail": {
				"eventCategoryCode": 1,
				"messageDetail": {
					"body": message
				}
			}
		}
		const form = new formData();
		form.append('messageEventDetail', JSON.stringify(body), { contentType: 'application/json; charset=utf-8', knownLength: form.getLength });
		request.post({
			url: `${process.env.MESSAGE_THREAD_API}threads/${threadId}/messages`,
			auth: {
				'bearer': `${accessToken}`
			},
			headers: {
				'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
			},
			body: form
		}, (err, response, body) => {
			if (err) {
				reject(JSON.parse(err))
			} else {
				resolve(JSON.parse(body));
			}
		})
	});
}

sendImage = (threadId, message, content, accessToken) => {
	return new Promise((resolve, reject) => {
		const body = {
			"messageEventDetail": {
				"eventCategoryCode": 3,
				"messageDetail": {
					"body": message
				}
			}
		}
		const form = new formData();
		form.append('messageEventDetail', JSON.stringify(body), { contentType: 'application/json; charset=utf-8' });
		/* fork or change the form-data in node_modules/form-data/form-data.js
			 var header = {
				'Content-Length': [].concat(contentLength || [])    add this line
			}*/
		form.append('imageData', content, { contentType: 'image/png', contentLength: content.length });
		request.post({
			url: `${process.env.MESSAGE_THREAD_API}threads/${threadId}/messages`,
			auth: {
				'bearer': `${accessToken}`
			},
			headers: {
				'Content-Type': `multipart/form-data; boundary=${form._boundary}`
			},
			body: form,
		}, (err, response, body) => {
			if (err) {
				reject(JSON.parse(err))
			} else {
				resolve(JSON.parse(body));
			}
		})
	})
}


// thread stuff
// generate a new thread
newThread = (onlineId, accessToken) => {
	return new Promise((resolve, reject) => {
		const body = {
			"threadDetail": {
				"threadMembers": [
					{ "onlineId": onlineId },
					{ "onlineId": process.env.MYID }
				]
			}
		}
		const form = new formData();
		form.append('threadDetail', JSON.stringify(body), { contentType: 'application/json; charset=utf-8' });
		return request.post({
			url: `${process.env.MESSAGE_THREAD_API}threads/`,
			auth: {
				'bearer': `${accessToken}`
			},
			headers: {
				'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
			},
			body: form
		}, (err, response, body) => {
			if (err) {
				reject(JSON.parse(err))
			} else {
				resolve(JSON.parse(body).threadId);
			}
		})
	})
}


oldThreads = accessToken => {
	return fetch(`${process.env.MESSAGE_THREAD_API}threads/`,
		{
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			},
			redirect: 'follow',
		})
		.then(res => res.json())
		.then(threads => {
			return threads.threads;
		})
}

//get one thread detail
detailThread = (threadId, count, accessToken) => {
	const field = {
		'fields': 'threadMembers,threadNameDetail,threadThumbnailDetail,threadProperty,latestTakedownEventDetail,newArrivalEventDetail,threadEvents',
		'count': count   //show upto 100 recent messages from one thread
	}
	return fetch(`${process.env.MESSAGE_THREAD_API}threads/${threadId}?` + querystring.stringify(field),
		{
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			},
			redirect: 'follow',
		})
		.then(res => res.json())
		.then(threads => {
			return threads;
		})
}

