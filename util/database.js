const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

require('dotenv').config();

let _db;

const mongoConnect = callback => {
    MongoClient
        .connect(process.env.DATABASE, { useNewUrlParser: true })
        .then(client => {
            console.log('Connected correctly to server');
            _db = client.db('psprices');
            callback();
        })
        .catch(err => {
            console.log(err);
            throw err;
        });
};

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'No database found!';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;