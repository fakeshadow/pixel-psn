const schedule = require('node-schedule');
const psnTokenController = require('../controllers/psn/tokens');
const psnMessageController = require('../controllers/psn/message')

schedule.scheduleJob('33 2 * * * *', () => {
    console.log('Refresh accessToken!');
    psnTokenController.getTokenScheduled();
})

//update threadslist per miniute. Change it at your own need.
schedule.scheduleJob('1 * * * * *', () => {
    psnMessageController.getAllThreades(() => console.log('Refreshed threadsList!'))
})

module.exports = schedule;