const schedule = require('node-schedule');
const psnTokenController = require('../controllers/psn/tokens');
const psnMessageController = require('../controllers/psn/message');
const psnTrophyController = require('../controllers/psn/trophy');

schedule.scheduleJob('33 2 * * * *', () => {
    console.log('Refreshing accessToken!');
    psnTokenController.getTokenScheduled();
})

schedule.scheduleJob('1 * * * * *', () => {
    psnMessageController
        .getAllThreades()
        .then()
        .catch(err => console.log('Failed to update threads list! ' + err));
})


// use trophy working every second and queue worker up to deal with rate limit.
schedule.scheduleJob('*/4 * * * * *', () => {
    psnTrophyController
        .trophyWorker()
        .catch(err => console.log(err));

})

delayAndShowErr = err => {
    setTimeout(() => {
        flag = true
        console.log(err);
    }, 5000);
}

module.exports = schedule;