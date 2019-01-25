const schedule = require('node-schedule');
const psnTokenController = require('../controllers/psn/tokens');
const psnMessageController = require('../controllers/psn/message')


schedule.scheduleJob('33 2 * * * *', () => {
    console.log('Refreshing accessToken!');
    psnTokenController.getTokenScheduled();
})

schedule.scheduleJob('1 * * * * *', () => {
    console.log('Updating threads!');
    psnMessageController.getAllThreades(() => console.log('Refreshed threadsList!'))
})

module.exports = schedule;