const schedule = require('node-schedule');
const psnTokenController = require('../controllers/psn/tokens');
const psnMessageController = require('../controllers/psn/message');
const psnTrophyController = require('../controllers/psn/trophy');
const psnStoreController = require('../controllers/psn/store');



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

// use trophy worker every 5 second and queue worker up to deal with rate limit.
schedule.scheduleJob(`*/5 * * * * *`, () => {
    psnTrophyController
        .trophyWorker()
        .catch(err => console.log(err));

})

// use store worker every 6 hours to get new gaming deals.
schedule.scheduleJob(`* * */6 * * *`, () => {
    console.log('Starting update store');
    psnStoreController
        .storeWorker()
        
        .catch(err => console.log(err));
})

delayAndShowErr = err => {
    setTimeout(() => {
        flag = true
        console.log(err);
    }, 5000);
}

module.exports = schedule;