'use strict'

const postObject = {
    type: 'object',
    properties: {
        uid: {
            type: 'string',
            minimum: 1
        },
        avatar: {
            type: 'string'
        },
        mainPid: {
            type: 'integer',
            minimum: 1
        },
        pid: {
            type: 'integer',
            minimum: 1
        },
        toPid: {
            type: 'integer',
            minimum: 0
        },
        postContent: {
            type: 'string'
        },
        postCount: {
            type: 'integer',
            minimum: 0
        },
        lastPostTime: {
            type: 'string'
        },
    },
    additionalProperties: false
}

const getPosts = {
    params: {
        type: 'object',
        required: ['cid', 'mainPid'],
        properties: {
            cid: {
                type: 'string',
            },
            mainPid: {
                type: 'integer',
                minimum: 1
            }
        }
    },
    response: {
        200: {
            type: 'array',
            items: postObject
        }
    }
}

const addPost = {
    body: {
        type: 'object',
        required: ['uid', 'avatar', 'toPid', 'cid', 'postContent'],
        properties: {
            uid: {
                type: 'string'
            },
            avatar: {
                type: 'string'
            },
            toPid: {
                type: 'integer',
                minimum: 0
            },
            cid: {
                type: 'string',
            },
            postContent: {
                type: 'string',
                minLength: 8,
                maxLength: 255
            }
        },
        additionalProperties: false
    }
}

module.exports = {
    addPost,
    getPosts,
    postObject
}