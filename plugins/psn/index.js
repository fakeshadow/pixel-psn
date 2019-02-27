'use strict'

const {
    adminLogin: adminSchema,
    profileSchema: profileSchema
} = require('./schemas')

module.exports = async (fastify, opts) => {
    fastify.addHook('preHandler', fastify.authPreHandler)
    fastify
        .get('/', testHandler)
        .post('/admin', { schema: adminSchema }, adminHandler)
        .post('/profile', { schema: profileSchema }, profileHandler)

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

async function testHandler(req,reply) {
    return {message: 'done'}
}

async function profileHandler(req, reply) {

}

async function adminHandler(req, reply) {
    return this.psnService.login(req.body);
}