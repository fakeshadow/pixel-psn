'use strict'

const {
    login: loingSchema,
    register: registerSchema
} = require('./schemas')

module.exports = async (fastify, opts) => {
    fastify.post('/register', { schema: registerSchema }, registerHandler)
}

module.exports[Symbol.for('plugin-meta')] = {
    decorators: {
        fastify: [
            'authPreHandler',
            'userService',
            'jwt'
        ]
    }
}

async function registerHandler(req, reply) {
    const { username, password, email } = req.body;
    await this.userService.createUser({ username, password, email });
}