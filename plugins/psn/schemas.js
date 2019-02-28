'use strict'

const earnedTrophiesObject = {
    type: 'object',
    properties: {
        platinum: {
            type: 'number'
        },
        gold: {
            type: 'number'
        },
        silver: {
            type: 'number'
        },
        bronze: {
            type: 'number'
        },
    },
    additionalProperties: false
}

const gameObject = {
    type: 'object',
    require: [],
    properties: {
        npCommunicationId: { type: 'string' },
        progress: { type: 'number' },
        earnedTrophies: earnedTrophiesObject,
        lastUpdateDate: { type: 'string' }
    },
    additionalProperties: false
}

const profileObject = {
    type: 'object',
    require: [],
    properties: {
        games: {
            type: 'array',
            items: gameObject
        },
        onlineId: {
            type: 'string'
        },
        npId: {
            type: 'string'
        },
        region: {
            type: 'string'
        },
        avatarUrl: {
            type: 'string'
        },
        aboutMe: {
            type: 'string'
        },
        languagesUsed: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        lastUpdateTime: {
            type: 'string'
        },
        plus: {
            type: 'number'
        },
        trophySummary: {
            type: 'object',
            properties: {
                level: {
                    type: 'number'
                },
                progress: {
                    type: 'number'
                },
                earnedTrophies: earnedTrophiesObject
            }
        }
    },
    additionalProperties: false
}

const adminLogin = {
    body: {
        type: 'object',
        require: ['uuid', 'tfa', 'password'],
        properties: {
            uuid: {
                type: 'string'
            },
            tfa: {
                type: 'string'
            },
            password: {
                type: 'string'
            }
        },
        additionalProperties: false
    },
    response: 200
}

const profileSchema = {
    // body: {
    //     type: 'object',
    //     require: ['psnid'],
    //     properties: {
    //         npid: {
    //             type: 'string'
    //         },
    //         psnid: {
    //             type: 'string'
    //         }
    //     },
    //     additionalProperties: false
    // },
    response: {
        200: profileObject
    }
}

module.exports = {
    adminLogin,
    profileSchema
}