const fp = require('fastify-plugin')

const schedule = require('node-schedule')

const failSafe = {
    isfailed: false,
    get get() {
        return this.isfailed
    },
    set set(failed) {
        this.isfailed = !this.isfailed
        return setTimeout(() => {
            this.isfailed = !this.isfailed
        }, 10000)
    }
}

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
            if (failSafe.get === false) {
                const work = await fastify.cacheService.getWork();
                if (!work) return null;
                const { onlineId } = work

                await fastify.psnService.getTrophySummaryRemote({ onlineId })
                await fastify.cacheService.deleteWork(onlineId);
                console.log('succeefully update user: ' + onlineId)
            }
        } catch (e) {
            failSafe.set = failed
            console.log(e)
        }
    });

    schedule.scheduleJob('3 23 * * * *', async () => {
        try {
           
                //fastify.psnService.compareStoreItemsPrices('ch', 'HK', '19')
                //fastify.psnService.compareStoreItemsPrices('en', 'US', '21')
            
        } catch (e) {
            console.log(e)
        }
    });

    next()
}, {
        fastify: '>=1.0.0',
        name: 'fastify-schedule'
    })