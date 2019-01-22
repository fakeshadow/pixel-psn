const schedule = require('node-schedule');
const psnController = require('../controllers/psn');

schedule.scheduleJob('33 2 * * * *', () => {
    console.log('Refresh accessToken!');
    psnController.getTokenScheduled();
})

schedule.scheduleJob('0 18 9  * * *', () => {
    console.log('Refresh Time!');
})

module.exports = schedule;