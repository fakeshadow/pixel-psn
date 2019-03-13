'use strict';

const fastify = require('fastify')();
const fp = require('fastify-plugin');
const multer = require('fastify-multer');

const { authPreHandler } = require('./hooks/auth');
const { psnPreHandler, psnPreSerialHandler } = require('./hooks/psn');

const PSNService = require('./plugins/psn/service');
const CacheService = require('./plugins/cache/service');
const PostService = require('./plugins/post/service');
const UserService = require('./plugins/user/service');

require('dotenv').config();

const decorateFastifyInstance = async fastify => {
    const db = fastify.mongo.db;

    const psnCollection = await db.createCollection('psn');
    const postCollection = await db.createCollection('post');

    const psnService = new PSNService(psnCollection);
    const postService = new PostService(postCollection);
    const userService = new UserService(postCollection);
    const cacheService = new CacheService(psnCollection);

    fastify
        .decorate('psnService', psnService)
        .decorate('postService', postService)
        .decorate('userService', userService)
        .decorate('cacheService', cacheService)
        .decorate('authPreHandler', authPreHandler)
        .decorate('psnPreHandler', psnPreHandler)
        .decorate('psnPreSerialHandler', psnPreSerialHandler)
};

async function connectToDatabases(fastify) {
    fastify
        .register(require('fastify-mongodb'), { url: process.env.MONGO, useNewUrlParser: true })
}

fastify
    .register(require('fastify-cors'), { origin: true, methods: ['GET', 'POST'] })
    .register(require('fastify-jwt'), { secret: process.env.JWT, algorithms: ['RS256'] })
    .register(multer.contentParser)
    .register(fp(connectToDatabases))
    .register(fp(decorateFastifyInstance))
    .register(require('./plugins/schedule'))
    .register(require('./plugins/psn'), { prefix: '/api/psn' })
    .register(require('./plugins/user'), { prefix: '/api/user' })
    .register(require('./plugins/post'), { prefix: '/api/post' });

const start = async () => {
    try {
        await fastify.listen(process.env.PORT || 3200, process.env.IP || '127.0.0.1');
        console.log(`server listening on ${fastify.server.address().port}`)
    } catch (e) {
        console.log(e);
        process.exit(1)
    }
};

start();