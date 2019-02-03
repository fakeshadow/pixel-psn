const schedule = require('node-schedule');
const psnTokenController = require('../controllers/psn/tokens');
const psnMessageController = require('../controllers/psn/message');
const psnTrophyController = require('../controllers/psn/trophy');
const psnStoreController = require('../controllers/psn/store');
const flag = require('./flag');


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

// use worker every 5 second and queue worker up to deal with rate limit.
schedule.scheduleJob('*/1 * * * * *', () => {
    if (flag.getFlag1() === true) {
        flag.setFalse1();
        psnTrophyController
        .scheduleProfileWorker()
        .then(() => flag.setTrue1())
        .catch(err => delayAndShowErr1(err));
    }
})

schedule.scheduleJob('*/1 * * * * *', () => {
    if (flag.getFlag2() === true) {
        flag.setFalse2();
        psnTrophyController
        .scheduleTrophyWorker()
        .then(() => flag.setTrue2())
        .catch(err => delayAndShowErr2(err));
    }
})

// use store worker every 6 hours to get new gaming deals.
// schedule.scheduleJob('*/6 * * *', () => {
//     console.log('Starting update store');
//     psnStoreController
//         .storeWorker()
//         .catch(err => console.log(err));
// })

delayAndShowErr1 = err => {
    setTimeout(() => {
        flag.setTrue1();
        console.log(err);
    }, 5000);
}

delayAndShowErr2 = err => {
    setTimeout(() => {
        flag.setTrue2();
        console.log(err);
    }, 5000);
}

module.exports = schedule;