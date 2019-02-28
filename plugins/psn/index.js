'use strict'

const {
    adminLogin: adminSchema,
    profileSchema: profileSchema
} = require('./schemas')

module.exports = async (fastify, opts) => {

    fastify
        .get('/store/:gameName', searchStoreHandler)
        .get('/:onlineId', { schema: profileSchema }, getProfileHandler)
        .get('/test/:onlineId', testGetSummary)

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

async function searchStoreHandler(req, reply) {
    const gameName = req.params.gameName;
    return this.psnService.getStoreItemRemote({gameName});
}

async function testGetSummary(req, reply) {
    const onlineId = req.params.onlineId
    await this.psnService.refreshAccessToken();
    const profile = await this.psnService.getPSNProfileRemote({ onlineId });
    return this.psnService.updateProfileLocal(profile);

}

async function getProfileHandler(req, reply) {
    const onlineId = req.params.onlineId
    const profile = await this.psnService.getUserLocal({ onlineId })
    if (profile) return profile;
    return this.psnService.getPSNProfileRemote({ onlineId });
}

async function adminHandler(req, reply) {
    return this.psnService.login(req.body);
}