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
        avatar: {
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
            require: ['jwt'],
            properties: {
                jwt: {
                    type: 'string'
                }
            },
            additionalProperties: false
        }
    }
}

module.exports = {
    register,
    login,
    userObject,
}