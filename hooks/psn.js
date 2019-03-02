'use strict'



const psnPreHandler = async (req, res) => {
    try {

        schedule.scheduleJob('*/5 * * * * *', async function () {
            console.log('refresh token success')
            return this.psnService.refreshAccessToken();
        });

        // use this when behind nginx
        // const ip = req.header('X-Real-IP') || req.connection.remoteAddress;  

        // const { password } = req.body;
        // const timeVialate = await this.redis.zscore('blacklist:ip', `${ip}`);
        // if (timeVialate > 3) throw new Error();
        // if (password === null || undefined) return;
        // if (password !== process.env.ADMIN_PASS) {
        //     this.redis.zadd('blacklist:ip', timeVialate ? timeVialate + 1 : 1, `${ip}`);
        //     throw new Error();
        // }
        const { password } = req.body;
        if (password && password !== process.env.ADMIN_PASS) throw new Error('unauthorized admin request');
    } catch (e) {
        res.send(e)
    }
}

// scheduled worker here
async function psnPreSerialHandler(req, res, payload) {
    try {
        const { type, profile } = payload;
        if (type && type === 'profile') await this.cacheService.addWork(profile.onlineId);
        return profile;
    } catch (e) {
        res.send(e)
    }
}

module.exports = {
    psnPreHandler,
    psnPreSerialHandler
}