'use strict'

const {
    adminLogin: adminSchema,
    getProfile: getProfileSchema,
    getGame: getGameSchema,
    getTrophy: getTrophySchema
} = require('./schemas')

module.exports = async (fastify, opts) => {

    fastify
        .get('/', testHandler)
        .get('/:onlineId', { schema: getProfileSchema }, getProfileHandler)
        .get('/store/:gameName', { schema: getGameSchema }, searchStoreHandler)
        .post('/trophy', { schema: getTrophySchema }, userTrophyHandler)

    fastify.register(async function (fastify) {
        fastify
            .addHook('preHandler', fastify.authPreHandler)
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
    // await this.psnService.refreshAccessToken();
    return this.psnService.sendMessageRemote(req);
}

async function userTrophyHandler(req, reply) {
    const { npCommunicationId, onlineId } = req.body;
    // await this.psnService.refreshAccessToken();
    const cached = await this.psnService.getUserTrophiesLocal({ npCommunicationId, onlineId });
    if (cached) return cached;
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
    const profileLocal = await this.psnService.getTrophySummaryLocal({ onlineId })
    if (profileLocal) return profileLocal
    const profile = await this.psnService.getPSNProfileRemote({ onlineId });
    await this.psnService.updateProfileLocal(profile);
    await this.psnService.getTrophySummaryRemote(profile);
    return profile;
}

async function adminHandler(req, reply) {
    return this.psnService.login(req.body);
}