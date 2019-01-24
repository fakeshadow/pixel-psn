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
        return threadDetails.filter(thread => thread.threadMembers.filter(member => member.onlineId === onlineId))
    }

    static findOnlineId(threadId) {
        return threadDetails.map(thread => {
            thread.threadId === threadId
            return thread.threadMembers
        })
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