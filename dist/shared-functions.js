"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseState = exports.requestTimeout = exports.objectRename = void 0;
/**
 *
 * @param obj
 * @param currentKey
 * @param newKey
 * @returns
 */
function objectRename(obj, currentKey, newKey) {
    if (typeof obj !== 'undefined' && currentKey !== newKey) {
        delete Object.assign(obj, { [newKey]: obj[currentKey] })[currentKey];
        return obj;
    }
    else {
        return null;
    }
}
exports.objectRename = objectRename;
;
/**
 *
 * @param ms
 * @param promise
 * @returns
 */
function requestTimeout(ms, promise) {
    // Create a promise that rejects in <ms> milliseconds
    let interrupt = new Promise((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            reject(`Request timed out after + ${ms} ms.`);
        }, ms);
    });
    // Returns a race between our timeout and the passed in promise
    return Promise.race([promise, interrupt]);
}
exports.requestTimeout = requestTimeout;
/**
 *
 * @param p
 * @returns
 */
function promiseState(p) {
    const t = {};
    return Promise.race([p, t])
        .then(v => (v === t) ? "pending" : "fulfilled", () => "rejected");
}
exports.promiseState = promiseState;
//# sourceMappingURL=shared-functions.js.map