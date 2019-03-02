'use strict'

const {
    adminLogin: adminSchema,
    getProfile: getProfileSchema,
    getGame: getGameSchema,
    getTrophy: getTrophySchema,
    getMessage: getMessageSchema
} = require('./schemas')

module.exports = async (fastify, opts) => {

    fastify
        .get('/', testHandler)
        .get('/message/:onlineId', { schema: getMessageSchema }, getMessageHandler)
        .post('/message', sendMessageHandler)
        .post('/trophy', { schema: getTrophySchema }, userTrophyHandler);

    fastify.register(async function (fastify) {
        fastify
            .addHook('preSerialization', fastify.psnPreSerialHandler)
            .get('/:onlineId', { schema: getProfileSchema }, getProfileHandler)
            .get('/store/:gameName', { schema: getGameSchema }, searchStoreHandler)
    })

    fastify.register(async function (fastify) {
        fastify
            .addHook('preHandler', fastify.psnPreHandler)
            .post('/admin', { schema: adminSchema }, adminHandler)
    })

    fastify.setErrorHandler((error, req, res) => {
        res.send(error);
    })
}

module.exports[Symbol.for('plugin-meta')] = {
    decorators: {
        fastify: [
            'psnService',
        ]
    }
}

async function testHandler(req, reply) {
    return this.psnService.getStoreItemRemote(req);
}

async function sendMessageHandler(req, reply) {
    return this.psnService.sendMessageRemote(req);
}

async function getMessageHandler(req, reply) {
    const onlineId = req.params.onlineId;
    return this.psnService.getMessageRemote({ onlineId });
}

async function userTrophyHandler(req, reply) {
    const { npCommunicationId, onlineId } = req.body;

    const trophiesCached = await this.psnService.getUserTrophiesLocal({ npCommunicationId, onlineId });

    const date = new Date();
    if (trophiesCached && date - trophiesCached.lastUpdateDate < process.env.TIMEGATE) return trophiesCached;

    const trophiesNew = await this.psnService.getUserTrophiesRemote({ npCommunicationId, onlineId });
    await this.psnService.updateUserTrophiesLocal({ npCommunicationId, trophiesNew });

    return trophiesNew;
}

async function searchStoreHandler(req, reply) {
    const gameName = req.params.gameName;
    const itemsCache = await this.psnService.getStoreItemLocal({ gameName })

    if (itemsCache.length) return itemsCache;

    const itemsNew = await this.psnService.getStoreItemRemote({ gameName });
    await this.psnService.updateStoreItemLocal(itemsNew);

    return itemsNew;
}

async function getProfileHandler(req, reply) {
    const onlineId = req.params.onlineId
    await this.psnService.refreshAccessToken();
    const profileCached = await this.psnService.getTrophySummaryLocal({ onlineId })

    const date = new Date();
    if (profileCached && date - profileCached.lastUpdateDate < process.env.TIMEGATE) return profileCached;

    const profile = await this.psnService.getPSNProfileRemote({ onlineId });
    await this.psnService.updateProfileLocal(profile);

    return { type: 'profile', profile };
}

async function adminHandler(req, reply) {
    return this.psnService.login(req.body);
}