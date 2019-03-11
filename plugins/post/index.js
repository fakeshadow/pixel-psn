'use strict'

const { addPost: addPostSchema, editPost: editPostSchema, getPosts: getPostsSchema, } = require('./schemas')

module.exports = async function (fastify, opts) {

    fastify.register(async function (fastify) {
        // fastify
        //     .addHook('preHandler', fastify.authPreHandler)
        //     .addHook('preHandler', fastify.postPreHandler)
        //     .addHook('preSerialization', fastify.postPreSerialHandler);
        fastify.get('/:cid/:mainPid', { schema: getPostsSchema }, getPostsHandler);
    })

    fastify.register(async function (fastify) {
        // fastify
        //     .addHook('preHandler', fastify.authPreHandler)
        //     .addHook('preSerialization', fastify.postPreSerialHandler);
        fastify.post('/', { schema: addPostSchema }, addPostHandler);
        // fastify.post('/edit', { schema: editPostSchema }, editPostHandler);
    })

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
    // const { uid } = req.user;
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

// async function editPostHandler(req, reply) {
//     const { uid } = req.user
//     const { pid, postContent } = req.body;
//     const postData = {
//         "pid": pid,
//         "postContent": postContent
//     }
//     return this.postService.editPost(uid, postData)
// }

async function getPostsHandler(req, reply) {
    const cid = req.params.cid;
    const mainPid = req.params.mainPid;
    return this.postService.getPosts({ cid, mainPid });
}