const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const psnRouter = require ('./routes/psn');

const schedule = require('./util/schedule');

const errorController = require('./controllers/error');
const psnController = require('./controllers/psn');

require('dotenv').config();

const app = express();

app.use(morgan('tiny'));
app.use(cors());

app.use(psnRouter);

app.use(errorController.get404);

psnController.checkToken();
schedule.scheduleJob();


app.listen(process.env.PORT || 3000, () => console.log('Listening on port: ', process.env.PORT || 3000));


