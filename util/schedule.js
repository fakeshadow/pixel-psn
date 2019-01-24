const schedule = require('node-schedule');
const psnTokenController = require('../controllers/psn/tokens');

schedule.scheduleJob('33 2 * * * *', () => {
    console.log('Refresh accessToken!');
    psnTokenController.getTokenScheduled();
})

schedule.scheduleJob('0 18 9  * * *', () => {
    console.log('Refresh Time!');
})

module.exports = schedule;