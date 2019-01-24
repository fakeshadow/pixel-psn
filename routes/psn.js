const express = require('express');

const psnController = require('../controllers/psn');
const psnTokenController = require('../controllers/psn/tokens');
const psnMessageController = require('../controllers/psn/message');

const router = express.Router();

// test endpoint//
//router.post('/test/', psnMessageController.sendText);
router.get('/test/stats', psnTokenController.getStatus);


// working
router.post('/message/send', psnMessageController.sendMessage); 

router.get('/trophies/getgame/:onlineId/:npCommunicationId', psnController.getIndividualGame);

router.get('/trophies/result', psnController.checkAllTrophies);

router.get('/trophies/getall/:onlineId/:waitTime', psnController.getAllTrophies);

router.get('/trophy/:start/:limit/:onlineId', psnController.getTrophies);

router.get('/profile/:onlineId', psnController.getProfile);

router.get('/login/:uuid/:tfa', psnTokenController.login);


module.exports = router;