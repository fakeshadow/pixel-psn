const express = require('express');

const psnTrophyController = require('../controllers/psn/trophy');
const psnTokenController = require('../controllers/psn/tokens');
const psnMessageController = require('../controllers/psn/message');
const psnProfileController = require('../controllers/psn/profile');
const psnStoreController = require('../controllers/psn/store');
const psnCommunityController = require('../controllers/psn/community');

const router = express.Router();

// test endpoint//
router.get('/test/stats/', psnTokenController.getStatus);


// test
router.get('/store/test', psnStoreController.test);

// commnutiy related

// message related
router.get('/message/new', psnMessageController.getThreadsModifiedDate);
router.post('/message/find', psnMessageController.crossFindId);
router.post('/message/send', psnMessageController.sendMessageToThread);
router.post('/message/send/direct', psnMessageController.sendMessageToPerson);
router.post('/message/receive', psnMessageController.getThreadMessages);
// need to work on auth middleware
router.post('/message/leave', psnMessageController.leaveThread);


// store related
router.get('/store/search/:gameName', psnStoreController.search);
router.get('/store/getgames', psnStoreController.getGames);

// trophy related
router.get('/trophies/getgame/:onlineId/:npId/:npCommunicationId', psnTrophyController.getIndividualGame);
router.get('/trophies/getall/:onlineId', psnTrophyController.getAllTrophies);
router.get('/trophy/:start/:limit/:onlineId', psnTrophyController.getTrophies);


// profie and autnetication
router.get('/profile/:onlineId', psnProfileController.getProfile);
router.post('/profile/activity', psnProfileController.getUserActivities);
router.post('/login', psnTokenController.login);


module.exports = router;