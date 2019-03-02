'use strict'

const fastify = require('fastify')();
const fp = require('fastify-plugin');

const { psnPreHandler, psnPreSerialHandler } = require('./hooks/psn');
const PSNService = require('./plugins/psn/service');
const CacheService = require('./plugins/cache/service')

require('dotenv').config();

fastify.use(require('morgan')('tiny'))

const decorateFastifyInstance = async fastify => {
    const db = fastify.mongo.db

    const psnCollection = await db.createCollection('psn');
    const psnService = new PSNService(psnCollection);
    const cacheService = new CacheService(psnCollection);

    fastify
        .decorate('psnService', psnService)
        .decorate('cacheService', cacheService)
        .decorate('psnPreHandler', psnPreHandler)
        .decorate('psnPreSerialHandler', psnPreSerialHandler)
}

async function connectToDatabases(fastify) {
    fastify
        .register(require('fastify-mongodb'), { url: process.env.MONGO, useNewUrlParser: true })
    //.register(require('fastify-redis'), { host: process.env.REDIS_IP, port: process.env.REDIS_PORT, family: 4, password: process.env.REDIS_PASS })
}

fastify
    .register(require('fastify-multipart'))
    .register(require('./util/schedule'))
    .register(fp(connectToDatabases))
    .register(fp(decorateFastifyInstance))
    .register(require('./plugins/psn'), { prefix: '/api/psn' })

const start = async () => {
    try {
        await fastify.listen(process.env.PORT || 3200, process.env.IP || '127.0.0.1')
        console.log(`server listening on ${fastify.server.address().port}`)
    } catch (e) {
        console.log(e)
        process.exit(1)
    }
}

start();