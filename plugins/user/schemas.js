'use strict'

const userObject = {
    type: 'object',
    require: ['uid', 'username', 'email', 'avatar'],
    properties: {
        uid: {
            type: 'integer',
            minmum: 1
        },
        username: {
            type: 'string'
        },
        email: {
            type: 'string'
        },
        npId: {
            type: 'string'
        }
    },
    additionalProperties: false
}

const register = {
    body: {
        type: 'object',
        required: ['username', 'password', 'email'],
        properties: {
            username: {
                type: 'string'
            },
            password: {
                type: 'string'
            },
            email: {
                type: 'string'
            }
        },
        additionalProperties: true
    },
    response: 200
}

const login = {
    body: {
        type: 'object',
        require: ['username', 'password'],
        properties: {
            username: {
                type: 'string'
            },
            password: {
                type: 'string'
            }
        },
        additionalProperties: false
    },
    response: {
        200: {
            type: 'object',
            require: ['jwt', 'profile'],
            properties: {
                jwt: {
                    type: 'string'
                },
                profile: userObject
            },
            additionalProperties: false
        }
    }
};

const getUser = {
    params: {
        type: 'object',
        properties: {
            uid: {
                type: 'integer',
                minmum: 1
            }
        }
    }
}

const linkPSN = {
    body: {
        type: 'object',
        require: ['onlineId', 'aboutMe'],
        properties: {
            onlineId: {
                type: 'string'
            },
            aboutMe: {
                type: 'string'
            }
        },
        additionalProperties: false
    },
    response: 200
}

module.exports = {
    register,
    login,
    getUser,
    userObject,
    linkPSN
}