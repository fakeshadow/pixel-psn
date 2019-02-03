let flag1 = true;
let flag2 = true;

module.exports = class Flag {
    static setTrue1() {
        return flag1 = true;
    }
    static setFalse1() {
        return flag1 = false;
    }
    static getFlag1() {
        return flag1;
    }
    static setTrue2() {
        return flag2 = true;
    }
    static setFalse2() {
        return flag2 = false;
    }
    static getFlag2() {
        return flag2;
    }
}