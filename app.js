const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');

const psnRouter = require('./routes/psn');
const schedule = require('./util/schedule');
const errorController = require('./controllers/error');
const psnTokenController = require('./controllers/psn/tokens');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer()
    .fields([
        { name: 'threadId', maxCount: 1 },
        { name: 'message', maxCount: 1 },
        { name: 'content', maxCount: 1 },
        { name: 'onlineId', maxCount: 1 },
        { name: 'type', maxCount: 1 }
    ]));

app.use(psnRouter);
app.use(errorController.get404);

//get tokens on service start
psnTokenController.checkToken(boolean => {
    if (boolean) {
        return console.log('Got refresh token')
    }
    console.log('No refresh token Please login');
})

mongoose
    .connect(process.env.DATABASE, { useNewUrlParser: true })
    .then(res => { 
        schedule.scheduleJob();
        console.log('Database connected'); 
    })
    .catch(err => console.log('Can not connect to database, Schedule job are not working'));

app.listen(process.env.PORT || 3000, () => console.log('Listening on port: ', process.env.PORT || 3000));


