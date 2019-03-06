'use strict';

const multer = require('fastify-multer');

const cpUpload = multer().fields([{ name: 'image', maxCount: 1 }, { name: 'message', maxCount: 1 }, { name: 'onlineId', maxCount: 1 }]);

const {
    adminLogin: adminSchema,
    getProfile: getProfileSchema,
    getGame: getGameSchema,
    getTrophy: getTrophySchema,
    getMessage: getMessageSchema
} = require('./schemas');

module.exports = async (fastify, opts) => {

    fastify
        .addHook('preHandler', cpUpload)
        .get('/activity/:onlineId/:type/:page', getActivityHandler)
        .get('/message/:onlineId', { schema: getMessageSchema }, getMessageHandler)
        .post('/message', sendMessageHandler)
        .delete('/message/:threadId', deleteMessageHandler)
        .post('/trophy', { schema: getTrophySchema }, userTrophyHandler);

    fastify.register(async function (fastify) {
        fastify
            .addHook('preSerialization', fastify.psnPreSerialHandler)
            .get('/discount', discountHandler)
            .get('/:onlineId', { schema: getProfileSchema }, getProfileHandler)
            .get('/store/:gameName/:language/:region/:ageLimit', { schema: getGameSchema }, searchStoreHandler)
    });

    fastify.register(async function (fastify) {
        fastify
            .addHook('preHandler', fastify.psnPreHandler)
            .post('/admin', { schema: adminSchema }, adminHandler)
    });

    fastify.setErrorHandler((error, req, res) => {
        res.send(error);
    })
};

module.exports[Symbol.for('plugin-meta')] = {
    decorators: {
        fastify: [
            'psnService',
        ]
    }
};


async function getActivityHandler(req, reply) {
    const onlineId = req.params.onlineId;
    const type = req.params.type;
    const page = req.params.page;
    return this.psnService.getUserActivity(onlineId, type, page)
}

async function discountHandler(requ, reply) {
    return this.psnService.getDiscounts();
}

async function sendMessageHandler(req, reply) {
    return this.psnService.sendMessageRemote(req);
}

async function getMessageHandler(req, reply) {
    const onlineId = req.params.onlineId;
    return this.psnService.getMessageRemote({ onlineId });
}

async function deleteMessageHandler(req, reply) {
    const threadId = req.params.threadId;
    return this.psnService.deleteMessageThread(threadId);
}

async function userTrophyHandler(req, reply) {
    const { npCommunicationId, onlineId } = req.body;

    const trophiesCached = await this.psnService.getUserTrophiesLocal({ npCommunicationId, onlineId });

    const date = new Date();
    if (trophiesCached && date - trophiesCached.lastUpdateDate < process.env.TIMEGATE) return trophiesCached;

    let trophies, npId;
    await Promise.all([
        trophies = await this.psnService.getUserTrophiesRemote({ npCommunicationId, onlineId }),
        { npId } = await this.psnService.getPSNProfileRemote({ onlineId })
    ]);

    if (trophies && npId) await this.psnService.updateUserTrophiesLocal({ npId, npCommunicationId, trophies });
    return trophies;
}

async function searchStoreHandler(req, reply) {
    const gameName = req.params.gameName;
    const language = req.params.language;
    const region = req.params.region;
    const ageLimit = req.params.ageLimit;

    const itemsCache = await this.psnService.getStoreItemLocal({ gameName });

    if (itemsCache.length) return itemsCache;

    const itemsNew = await this.psnService.getStoreItemRemote({ gameName, language, region, ageLimit });
    await this.psnService.updateStoreItemLocal(itemsNew);

    return itemsNew;
}

async function getProfileHandler(req, reply) {
    const onlineId = req.params.onlineId;

    const profileCached = await this.psnService.getTrophySummaryLocal({ onlineId });

    const date = new Date();
    if (profileCached && date - profileCached.lastUpdateDate < process.env.TIMEGATE) return profileCached;

    const profile = await this.psnService.getPSNProfileRemote({ onlineId });
    await this.psnService.updateProfileLocal(profile);

    return { type: 'profile', profile };
}

async function adminHandler(req, reply) {
    return this.psnService.login(req.body);
}