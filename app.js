const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

const psnRouter = require('./routes/psn');

const schedule = require('./util/schedule');

const errorController = require('./controllers/error');
const psnController = require('./controllers/psn');

require('dotenv').config();

const app = express();

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(cors());

app.use(psnRouter);

app.use(errorController.get404);

//get tokens on service start
psnController.checkToken(boolean => {
    if (boolean) {
        return console.log('Got refresh token')
    } 
    console.log('No refresh token Please login');
})

//schedule jobs like refresh tokens
schedule.scheduleJob();


app.listen(process.env.PORT || 3000, () => console.log('Listening on port: ', process.env.PORT || 3000));


