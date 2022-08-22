"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectRename = void 0;
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
//# sourceMappingURL=shared-functions.js.map