const express = require('express');

const psnController = require('../controllers/psn');

const router = express.Router();

// test endpoint
router.get('/test/stats', psnController.getStatus);


router.get('/trophies/result', psnController.checkAllTrophies)
router.get('/trophies/getall/:onlineId/:waitTime', psnController.getAllTrophies);

router.get('/trophy/:start/:limit/:onlineId', psnController.getTrophies);

router.get('/profile/:onlineId', psnController.getProfile);

router.get('/login/:uuid/:tfa', psnController.login);


module.exports = router;