let threadDetails = [];

module.exports = class ThreadDetail {
    constructor(threadMembers, threadEvents, threadId, threadModifiedDate) {
        this.threadMembers = threadMembers,
            this.threadEvents = threadEvents,
            this.threadId = threadId,
            this.threadModifiedDate = threadModifiedDate
    }

    save() {
        threadDetails.push(this);
    }

    static findThreadId(onlineId) {
        let temp = [];
        threadDetails.map(thread => {
            for (let i of thread.threadMembers) {
                if (i.onlineId === onlineId) {
                    temp.push({ 'threadId': thread.threadId })
                }
            }
        })
        return temp;
    }

    static findOnlineId(threadId) {
        let temp = [];
        for (let t of threadDetails) {
            if (t.threadId === threadId) {
                temp.push({ 'threadMembers': t.threadMembers })
            }
        }
        return temp;
    }

    static getThreadsModifiedDate() {
        return threadDetails.map(thread => ({ 'threadId': thread.threadId, 'threadModifiedDate': thread.threadModifiedDate }))
    }


    static getAllDetails() {
        return threadDetails;
    }

    static clear() {
        threadDetails = [];
    }
}