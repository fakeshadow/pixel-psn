const express = require('express');

const psnController = require('../controllers/psn');

const router = express.Router();

//router.get('/test', psnController.testSave);

router.get('/profile/:onlineId', psnController.getProfile);

router.get('/:uuid/:tfa', psnController.login);



module.exports = router;