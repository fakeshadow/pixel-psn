const formData = require('form-data');
const request = require('request');
const fetch = require('node-fetch');
const querystring = require('querystring');

const token = require('./tokens');

require('dotenv').config();


//send message(only text message support)
exports.sendMessage = (req, res) => {
	console.log(req.body.threadId);
	console.log(req.body.message);
	console.log(req.body.type);
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
	request.post({
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
oldThreads = () => {
	const accessToken = token.getLocalToken();
	fetch(`${process.env.MESSAGE_THREAD_API}threads/`,
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
detailThread = threadId => {
	const accessToken = token.getLocalToken();
	const field = {
		'fields': 'threadMembers,threadNameDetail,threadThumbnailDetail,threadProperty,latestTakedownEventDetail,newArrivalEventDetail,threadEvents',
		'count': 1   //could be recent mesesages counter of this thread
	}
	fetch(`${process.env.MESSAGE_THREAD_API}threads/${threadId}?` + querystring.stringify(field),
		{
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			},
			redirect: 'follow',
		})
		.then(res => res.json())
		.then(threads => {
			res.json(threads);
			return threads.threads;
		})
}

