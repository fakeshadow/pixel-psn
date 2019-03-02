const fp = require('fastify-plugin')

const schedule = require('node-schedule')

module.exports = fp(function (fastify, opts, next) {

    schedule.scheduleJob('33 2 * * * *', async () => {
        try {
            console.log('refreshing token')
            await fastify.psnService.refreshAccessToken();
            console.log('refresh token success')
        } catch (e) {
            console.log(e)
        }
    });

    schedule.scheduleJob('*/30 * * * * *', async () => {
        try {
            const work = await fastify.cacheService.getWork();
            if (!work) return null;
            const { onlineId } = work

            await fastify.psnService.getTrophySummaryRemote({ onlineId })
            await fastify.cacheService.deleteWork(onlineId);
            console.log('succeefully update user: ' + onlineId)
        } catch (e) {
            console.log(e)
        }
    });

    next()
}, {
        fastify: '>=1.0.0',
        name: 'fastify-schedule'
    })