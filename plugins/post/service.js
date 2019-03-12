'use strict'

class PostService {
    constructor(postCollection) {
        this.postCollection = postCollection;
    }

    async getPosts(query) {
        try {
            const { cid, mainPid } = query;

            const aggregate = {
                cid,
            };

            return this.postCollection.aggregate([
                { $match: { $and: [aggregate, { mainPid: { $lt: mainPid } }] } },
                { $limit: 20 },
                { $sort: { mainPid: -1 } },
                { $project: { _id: 0 } },
            ]).toArray();
        } catch (e) {
            throw e
        }
    }

    async addPost(postData) {
        const { uid, cid, toPid, postContent, avatar } = postData;
        const _toPid = parseInt(toPid, 10);

        if (!postContent) throw new Error('illegal postContent');

        const { value } = await this.postCollection.findOneAndUpdate({ nextPid: { $gt: 0 } }, { $inc: { nextPid: 1 } }, { projection: { _id: 0, nextPid: 1 }, returnOriginal: true, upsert: false })
        if (!value) throw new Error('Can not get pid from database')
        const pid = value.nextPid;

        const date = new Date();


        const postQuery = _toPid > 0 ? {
            uid,
            avatar,
            cid,
            pid,
            toPid: _toPid,
            postContent: postContent,
            postCount: 0,
            lastPostTime: date
        } : {
                uid,
                avatar,
                cid,
                pid,
                mainPid: pid,
                postContent: postContent,
                postCount: 0,
                lastPostTime: date
            }
        if (_toPid > 0) await this.postCollection.findOneAndUpdate({ pid: _toPid }, { $inc: { postCount: 1 }, $set: { loastPostTime: date } }, { returnOriginal: false, upsert: false, projection: { _id: 0 } });
        return this.postCollection.insertOne(postQuery, { projection: { _id: 0 } });
    }

    // async editPost(uid, postData) {
    //     try {
    //         const { pid, postContent } = postData
    //         const _pid = parseInt(pid, 10);
    //         const date = new Date();

    //         const { value } = await this.postCollection.findOneAndUpdate(
    //             { uid: _uid, pid: _pid, },
    //             { $set: { postContent: postContent, createdAt: date } },
    //             { returnOriginal: false, upsert: true, projection: { _id: 0 } });

    //         return value;
    //     } catch (e) {
    //         throw e;
    //     }
    // }

    async ensureIndexes(db) {
        await db.command({
            'collMod': this.postCollection.collectionName,

        })
        await this.postCollection.createIndex({ 'pid': 1, 'mainPid': -1 }, { unique: false })
    }
}

module.exports = PostService