'use strict'

class PSN {
    constructor(http) {
        this.http = http
    }

    async getAcceeToken(uuid, tfa) {

        const { npsso } = await getNpsso(uuid, tfa);
        const grantcode = await getGrant(npsso);
        return getToken(grantcode);
    }

    getProfile(onlineId, accessToken) {
        const fields = {
            'fields': '@default,relation,requestMessageFlag,presence,@personalDetail,trophySummary',
        }
        const option = {
            url: `${process.env.USERS_API}${onlineId}/profile?` + qs.stringify(fields),
            auth: {
                'bearer': `${accessToken}`
            }
        }
        return this.http.get(option);
    }

    getIndividualGame(npCommunicationId, onlineId, accessToken) {

        const fields = {
            'fields': '@default,trophyRare,trophyEarnedRate',
            'npLanguage': 'en',
            'comparedUser': onlineId
        }
        const option = {
            url: `${process.env.USER_TROPHY_API}/${npCommunicationId}/trophyGroups/all/trophies?` + qs.stringify(fields),
            auth: {
                'bearer': `${accessToken}`
            }
        }
        return this.http.get(option);
    }

    getSummary(offset, onlineId, accessToken) {
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
                'bearer': `${accessToken}`
            }
        }
        return this.http.get(option);
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
        return this.http.post(option);
    }
}

module.exports = PSN;


const getToken = (grantcode) => {
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
    return this.http.post(option);
}

const getGrant = (npsso) => {
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
    const headers = response.headers['x-np-grant-code']

    return this.http.getResponseHeader(option, headers);
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
    return this.http.post(option);
}