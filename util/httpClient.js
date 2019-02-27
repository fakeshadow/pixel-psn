const request = require('request')

class HttpClient {

    post(option) {
        return new Promise((resolve, reject) => {
            request.post(option, (err, response, body) => {
                if (err) {
                    reject(JSON.parse(err));
                } else {
                    resolve(JSON.parse(body));
                }
            })
        })
    }

    get(option) {
        return new Promise((resolve, reject) => {
            request.get(option, (err, response, body) => {
                if (err) {
                    reject(JSON.parse(err));
                } else {
                    resolve(JSON.parse(body));
                }
            })
        })
    }

    getResponseHeader(option, header) {
        return new Promise((resolve, reject) => {
            request.get(option, (err, response, body) => {
                if (err) {
                    reject(JSON.parse(err));
                } else {
                    resolve(header);
                }
            })
        })
    }
}

module.exports = HttpClient;