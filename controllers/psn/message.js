const formData = require('form-data');
const request = require('request');
const fetch = require('node-fetch');
const querystring = require('querystring');

const token = require('./tokens');
const ThreadDetail = require('../../models/psn/messages/threaddetails');

require('dotenv').config();


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


//send message(only text message support)
exports.sendMessage = (req, res) => {
	const accessToken = token.getLocalToken();
	if (req.body.type !== '1') {
		return res.send('Only text message support right now')
	}
	// need to import message check to filter dirty words,strings, etc.
	// need to import threadId check to reject wrong id.
	sendText(req.body.threadId, req.body.message, accessToken, result => {
		res.send(result);
	})
}


//get all threads with major detail, used for schedule update
exports.getAllThreades = callback => {
	oldThreads()
		.then(threads => threads.map(thread => ({ 'threadId': thread.threadId })))
		.then(async(threadIds) => {
			ThreadDetail.clear();
			for (let id of threadIds) {
				const detail = await detailThread(id.threadId, 1); //count could be adjusted. 
				const threadDetail = new ThreadDetail(detail.threadMembers, detail.threadEvents, detail.threadId, detail.threadModifiedDate);
				threadDetail.save();
			}
			console.log(ThreadDetail.getAllDetails());
			callback();
		})
		.catch(err => callback(err));	
}

// message stuff
sendText = (threadId, text, accessToken, callback) => {
	// const accessToken = token.getLocalToken();
	const body = {
		"messageEventDetail": {
			"eventCategoryCode": 1,
			"messageDetail": {
				"body": text
			}
		}
	}
	const form = new formData();
	form.append('messageEventDetail', JSON.stringify(body), { contentType: 'application/json; charset=utf-8' });
	return request.post({
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
			callback(err);
		}
		callback(body);
	})
}


// thread stuff
// generate a new thread
newThread = (onlineId, myId) => {
	const accessToken = token.getLocalToken();
	const body = {
		"threadDetail": {
			"threadMembers": [
				{ "onlineId": myId },
				{ "onlineId": onlineId }
			]
		}
	}
	// ugly codes. node-fetch seems can't handle custom multipart headers.
	const form = new formData();
	form.append('threadDetail', JSON.stringify(body), { contentType: 'application/json; charset=utf-8' });
	console.log(form);
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
			return err;
		}
		console.log(body);
		return res.send(body);
	})
}


//get all existed threads
async function oldThreads() {
	const accessToken = token.getLocalToken();
	return await fetch(`${process.env.MESSAGE_THREAD_API}threads/`,
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
async function detailThread(threadId, count) {
	const accessToken = token.getLocalToken();
	const field = {
		'fields': 'threadMembers,threadNameDetail,threadThumbnailDetail,threadProperty,latestTakedownEventDetail,newArrivalEventDetail,threadEvents',
		'count': count   //show upto 100 recent messages from one thread
	}
	return await fetch(`${process.env.MESSAGE_THREAD_API}threads/${threadId}?` + querystring.stringify(field),
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

