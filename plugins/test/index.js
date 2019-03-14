'use strict';

module.exports = async (fastify, opts) => {

    fastify.get('/', testHandler)
    

    fastify.setErrorHandler((error, req, res) => {
        res.send(error);
    })
};

module.exports[Symbol.for('plugin-meta')] = {
    decorators: {
        fastify: [
        ]
    }
};

async function testHandler(req, reply) {
    reply.send('Hello World')
}