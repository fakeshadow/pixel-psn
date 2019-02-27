'use strict'

const gameObject = {
    type: 'object',
    require: []
}

const profileObject = {
    type: 'object',
    require: ['games', 'onlineId', 'region', 'avatarUrl', 'trophySummary', 'lastUpdateTime'],
    properties: {
        games: {
            type: 'array',
            items: gameObject
        },
        onlineId: {
            type: 'string'
        },
        region: {
            type: 'string'
        },
        avatarUrl: {
            type: 'string'
        },
        lastUpdateTime: {
            type: 'string'
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
                earnedTrophies: {
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
                    }
                }
            }
        }
    }
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
    body: {
        type: 'object',
        require: ['npid', 'psnid'],
        properties: {
            npid: {
                type: 'string'
            },
            psnid: {
                type: 'string'
            }
        },
        additionalProperties: false
    },
    response: {
        200: profileObject
    }
}

module.exports = {
    adminLogin,
    profileSchema
}