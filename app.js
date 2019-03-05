'use strict'

const fastify = require('fastify')();
const fp = require('fastify-plugin');
const multer = require('fastify-multer')

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
}

fastify
    .register(require('fastify-cors'), { origin: true, methods: ['GET', 'POST'] })
    .register(multer.contentParser)
    .register(fp(connectToDatabases))
    .register(fp(decorateFastifyInstance))
    .register(require('./plugins/schedule'))
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