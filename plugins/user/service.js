'use strict'

const { saltHashPassword, checksaltHashPassword } = require('../../util/salthash');

class User {
    constructor(postCollection) {
        this.postCollection = postCollection
    }

    async createUser(query) {
        const { username, email, password } = query;
        const _username = username.replace(/ /g, '').trim();
        const _email = email.replace(/ /g, '').trim();
        const result = await this.postCollection.find({ $or: [{ username: _username }, { email: _email }] }).toArray();
        if (result.length) throw new Error('username or email taken');

        const saltedpassword = await saltHashPassword(password);
        const { value } = await this.post.findOneAndUpdate({ nextUid: { $gt: 0 } }, { $inc: { nextUid: 1 } }, { returnOriginal: true, upsert: true });
        if (!value) throw new Error('Can not get uid from database');
        const { nextUid } = value;

        return this.postCollection.insertOne({ uid: nextUid, username: _username, email: _email, saltedpassword: saltedpassword, avatar: '' });
    }

    async login(query) {
        const { username, password } = query;
        const _username = username.replace(/ /g, '').trim();
        const { uid } = await this.userCollection.findOne({ username: _username }, { projection: { _id: 0 } });
        const checkSalt = await checksaltHashPassword(saltedpassword, password);
        if (!uid || !checkSalt) throw new Error('Failed to login')
        return { uid }
    }

    async linkingPSN() {

    }
}

module.exports = User;