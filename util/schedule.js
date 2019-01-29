const schedule = require('node-schedule');
const psnTokenController = require('../controllers/psn/tokens');
const psnMessageController = require('../controllers/psn/message');
const psnTrophyController = require('../controllers/psn/trophy');

let flag = true;

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
// schedule.scheduleJob('1 * * * * * *', () => {
//     if (flag === true) {
//         flag === false;
//         psnTrophyController
//             .trophyWorker()
//             .then(() => flag === true)
//             .catch(err => {
//                 setTimeout => (flag === true, 10000);
//                 console.log(err);
//             })
//     }
// })



module.exports = schedule