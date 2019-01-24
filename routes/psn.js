const express = require('express');

const psnController = require('../controllers/psn');
const psnTokenController = require('../controllers/psn/tokens');
const psnMessageController = require('../controllers/psn/message');

const router = express.Router();

// test endpoint//
router.get('/test/stats/', psnTokenController.getStatus);


// message related
router.get('/message/new', psnMessageController.getThreadsModifiedDate);
router.post('/message/find', psnMessageController.crossFindId);
router.post('/message/send', psnMessageController.sendMessage);
router.post('/message/receive', psnMessageController.getThreadMessages);


// trophy retated
router.get('/trophies/getgame/:onlineId/:npCommunicationId', psnController.getIndividualGame);
router.get('/trophies/result', psnController.checkAllTrophies);
router.get('/trophies/getall/:onlineId/:waitTime', psnController.getAllTrophies);
router.get('/trophy/:start/:limit/:onlineId', psnController.getTrophies);


// profie and autnetication
router.get('/profile/:onlineId', psnController.getProfile);
router.post('/login', psnTokenController.login);


module.exports = router;