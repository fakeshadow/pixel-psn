const fs = require('fs');
const path = require('path'); 

const p = path.join(path.dirname(process.mainModule.filename), 'cert', 'tokens.json');

module.exports = class Cert {
    constructor(refreshToken) {
        this.refreshToken = refreshToken;
    }

    save() {
        return fs.writeFile(p, JSON.stringify(this), err => console.log(err));     
    }

    getCert(callback) {
        fs.readFile(p, (err, file) => {
            callback(JSON.parse(file));
        });
    }
}