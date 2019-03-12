'use strict'

const { addPost: addPostSchema, editPost: editPostSchema, getPosts: getPostsSchema, } = require('./schemas')

module.exports = async function (fastify, opts) {

    fastify.get('/:cid/:mainPid', { schema: getPostsSchema }, getPostsHandler);
    fastify.post('/', { schema: addPostSchema }, addPostHandler);
    
    fastify.setErrorHandler((error, req, res) => {
        res.send(error);
    })
}

module.exports[Symbol.for('plugin-meta')] = {
    decorators: {
        fastify: [
            'postService'
        ]
    }
}

async function addPostHandler(req, reply) {
    const { uid, cid, toPid, postContent, avatar } = req.body;
    const postData = {
        'uid': uid,
        'avatar': avatar,
        'cid': cid,
        'toPid': toPid,
        'postContent': postContent
    }
    return this.postService.addPost(postData);
}

async function getPostsHandler(req, reply) {
    const cid = req.params.cid;
    const mainPid = req.params.mainPid;
    return this.postService.getPosts({ cid, mainPid });
}