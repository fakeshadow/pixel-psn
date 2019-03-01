'use strict'

const qs = require('querystring');
const http = require('./httpClient');
const formData = require('form-data')

class PSN {
    async getAcceeToken(uuid, tfa) {
        const { npsso } = await getNpsso(uuid, tfa);
        const grantcode = await getGrant(npsso);
        return getToken(grantcode);
    }

    getProfile(onlineId, access_token) {
        const fields = {
            'fields': '@default,relation,requestMessageFlag,presence,@personalDetail,trophySummary',
        }
        const option = {
            url: `${process.env.USERS_API}${onlineId}/profile?` + qs.stringify(fields),
            auth: {
                'bearer': `${access_token}`
            }
        }
        return http.get(option);
    }

    getIndividualGame(npCommunicationId, onlineId, access_token) {
        const fields = {
            'fields': '@default,trophyRare,trophyEarnedRate',
            'npLanguage': 'en',
            'comparedUser': onlineId
        }
        const option = {
            url: `${process.env.USER_TROPHY_API}/${npCommunicationId}/trophyGroups/all/trophies?` + qs.stringify(fields),
            auth: {
                'bearer': `${access_token}`
            }
        }
        return http.get(option);
    }

    getSummary(offset, onlineId, access_token) {
        const fields = {
            'fields': '@default',
            'npLanguage': 'en',
            'iconSize': 'm',
            'platform': 'PS3,PSVITA,PS4',
            'offset': offset,
            'limit': 100,
            'comparedUser': onlineId
        }
        const option = {
            url: `${process.env.USER_TROPHY_API}?` + qs.stringify(fields),
            auth: {
                'bearer': `${access_token}`
            }
        }
        return http.get(option);
    }

    getExistingMessageThreads(access_token) {
        const option = {
            url: `${process.env.MESSAGE_THREAD_API}threads/`,
            auth: {
                'bearer': `${access_token}`
            }
        };
        return http.get(option);
    }

    getThreadDetail(threadId, count, access_token) {
        const field = {
            'fields': 'threadMembers,threadNameDetail,threadThumbnailDetail,threadProperty,latestTakedownEventDetail,newArrivalEventDetail,threadEvents',
            'count': count //show upto 100 recent messages from one thread
        }
        const option = {
            url: `${process.env.MESSAGE_THREAD_API}threads/${threadId}?` + qs.stringify(field),
            auth: {
                'bearer': `${access_token}`
            }
        };
        return http.get(option)
    }

    sendMessage(threadId, message, content, access_token) {
        if (content) return sendImage(threadId, message, content, access_token);
        if (message && !content) return sendText(threadId, message, access_token);
        return null;
    }

    generateNewMessageThread(onlineId, access_token) {
        const body = { "threadDetail": { "threadMembers": [{ "onlineId": onlineId }, { "onlineId": process.env.MYID }] } }
        const form = new formData();
        form.append('threadDetail', JSON.stringify(body), { contentType: 'application/json; charset=utf-8' });
        const option = {
            url: `${process.env.MESSAGE_THREAD_API}threads/`,
            auth: {
                'bearer': `${access_token}`
            },
            headers: {
                'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
            },
            body: form
        };
        return http.post(option);
    }

    leaveMessageThread(threadId, access_token) {
        const option = {
            url: `${process.env.MESSAGE_THREAD_API}threads/${threadId}/users/me`,
            auth: {
                'bearer': `${access_token}`
            }
        }
        return http.del(option)
    }

    getUserActivities(onlineId, type, page, access_token) {

        const body = {
            includeComments: true,
            offset: 0,
            blockSize: 10
        }
        const accessToken = token.getLocalToken();
        const option = {
            url: `${process.env.ACTIVITY_API}v1/users/${onlineId}/${type}/${page}?` + qs.stringify(body),
            auth: {
                'bearer': `${access_token}`
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            // body: qs.stringify({
            //     filters: PLAYED_GAME,
            //     filters: TROPHY,
            //     includeComments: false,
            //     offset: 1,
            //     blockSize: 5
            // }),
            gzip: true
        }
        return http.get(option)
    }

    searchGame(name) {
        const option = {
            url: `${process.env.STORE_API}tumbler-search/${name}?suggested_size=999&mode=game`
        }
        return http.get(option);
    }

    async showGameDetail(gameId) {
        const option = {
            url: `${process.env.STORE_API}resolve/${gameId}`
        }
        return await http.get(option);
    }

    refreshAccessToken(refreshToken) {
        const option = {
            url: `${process.env.AUTH_API}oauth/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: qs.stringify({
                app_context: 'inapp_ios',
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                refresh_token: refreshToken,
                duid: process.env.DUID,
                scope: process.env.SCOPE,
                grant_type: 'refresh_token'
            })
        }
        return http.post(option);
    }
}

module.exports = PSN;


//helper functions
const getToken = grantcode => {
    const option = {
        url: `${process.env.AUTH_API}oauth/token`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: qs.stringify({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            duid: process.env.DUID,
            scope: process.env.SCOPE,
            code: grantcode,
            grant_type: 'authorization_code'
        })
    }
    return http.post(option);
}

const getGrant = npsso => {
    const code_request = {
        "duid": process.env.DUID,
        "app_context": "inapp_ios",
        "client_id": process.env.CLIENT_ID,
        "scope": process.env.SCOPE,
        "response_type": "code",
    }
    const option = {
        url: `${process.env.AUTH_API}oauth/authorize?` + qs.stringify(code_request),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        headers: {
            'Cookie': `npsso=${npsso}`
        },
        followRedirect: false
    }

    return http.getResponseHeader(option);
}

const getNpsso = (uuid, tfa) => {
    const option = {
        url: `${process.env.AUTH_API}ssocookie`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: qs.stringify({
            authentication_type: 'two_step',
            client_id: process.env.CLIENT_ID,
            ticket_uuid: uuid,
            code: tfa
        })
    }
    return http.post(option);
}

const sendText = (threadId, message, access_token) => {
    const body = { "messageEventDetail": { "eventCategoryCode": 1, "messageDetail": { "body": message } } }
    const form = new formData();
    form.append('messageEventDetail', JSON.stringify(body), { contentType: 'application/json; charset=utf-8', knownLength: form.getLength });
    const option = {
        url: `${process.env.MESSAGE_THREAD_API}threads/${threadId}/messages`,
        auth: {
            'bearer': `${access_token}`
        },
        headers: {
            'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
        },
        body: form
    };
    return http.post(option);
}

const sendImage = (threadId, message, content, access_token) => {
    console.log(content.length)
    const body = { "messageEventDetail": { "eventCategoryCode": 3, "messageDetail": { "body": message } } }
    const form = new formData();
    form.append('messageEventDetail', JSON.stringify(body), { contentType: 'application/json; charset=utf-8' });
    /* fork or change the form-data in node_modules/form-data/form-data.js
         var header = {
            'Content-Length': [].concat(contentLength || [])    add this line
        }*/
    form.append('imageData', content, { contentType: 'image/png', contentLength: content.length });
    const option = {
        url: `${process.env.MESSAGE_THREAD_API}threads/${threadId}/messages`,
        auth: {
            'bearer': `${access_token}`
        },
        headers: {
            'Content-Type': `multipart/form-data; boundary=${form._boundary}`
        },
        body: form,
    };
    return http.post(option).catch(e=>console.log(e))
}
