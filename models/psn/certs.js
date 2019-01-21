const fs = require('fs');
const path = require('path'); 

const p = path.join(path.dirname(process.mainModule.filename), 'cert', 'tokens.json');

module.exports = class Cert {
    constructor(accessToken, refreshToken, expiresIn) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }

    save() {
        return fs.writeFile(p, JSON.stringify(this), err => console.log(err));
       
    }

    getCert(callback) {
        fs.readFile(p, (err, file) => {
            console.log(err);
            callback(JSON.parse(file));
        });
    }
}