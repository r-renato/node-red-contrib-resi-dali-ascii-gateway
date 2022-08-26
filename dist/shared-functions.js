"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareDALIResponse = exports.invalidPayloadIn = exports.promiseState = exports.requestTimeout = exports.objectRename = void 0;
const shared_interfaces_1 = require("./shared-interfaces");
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
function invalidPayloadIn(msg) {
    return !(msg && Object.prototype.hasOwnProperty.call(msg, 'payload'));
}
exports.invalidPayloadIn = invalidPayloadIn;
function isSet(value, bitPos) {
    var result = Math.floor(value / Math.pow(2, bitPos)) % 2;
    return result == 1;
}
function decodeDALIQueryStatusResp(prefix, suffix) {
    let data = suffix.split(',');
    let code = parseInt(data[0]);
    let resp = parseInt(data[1]);
    let exitCode = (shared_interfaces_1.RESIRESP.OK.name == prefix && code == 1);
    let result = {};
    if (exitCode) {
        result = {
            /* Note STATUS INFORMATION: 8-bit data indicating the status of a slave.
                The meanings of the bits are as follows:
                bit 0 Status of control gear :<0>=OK
                bit 1 Lamp failure :<0>=OK
                bit 2 Lamp arc power on :<0>=OFF
                bit 3 Query Limit Error :<0>=No
                bit 4 Fade running:<0>=fade is ready, <1>=fade is running
                bit 5 Query RESET STATE :<0>=No
                bit 6 Query Missing short address :<0>=No
                bit 7 Query POWER FAILURE :<0>=No
              */
            statusControlGear: isSet(resp, 0),
            lampFailure: isSet(resp, 1),
            lampArcPowerOn: isSet(resp, 2),
            queryLimitError: isSet(resp, 3),
            fadeRunning: isSet(resp, 4),
            queryResetState: isSet(resp, 5),
            queryMissingShortAddress: isSet(resp, 6),
            queryPowerFailure: isSet(resp, 7)
        };
    }
    ;
    result.done = (shared_interfaces_1.RESIRESP.OK.name == prefix);
    if (shared_interfaces_1.RESIRESP.OK.name == prefix && code == 9)
        result.timeout = (shared_interfaces_1.RESIRESP.OK.name == prefix && code == 9);
    return (result);
}
function decodeDALIResp(prefix, suffix) {
    let data = suffix.split(',');
    let result = {};
    result.done = (shared_interfaces_1.RESIRESP.OK.name == prefix);
    if (data.length > 1) {
        let code = parseInt(data[0]);
        let resp = parseInt(data[1]);
        result.value = resp;
        if (shared_interfaces_1.RESIRESP.OK.name == prefix && code == 9)
            result.timeout = (shared_interfaces_1.RESIRESP.OK.name == prefix && code == 9);
    }
    console.log("decodeDALIResp: " + result);
    return (result);
}
function prepareDALIResponse(msg, response) {
    let result = {};
    let repTokenized = response.split(':');
    console.log("prepareDALIResponse: " + JSON.stringify(msg) + " / " + repTokenized
        + "[" + msg.payload.command.replace('#', '') + "]"
        + "[" + msg.payload.action.replace(':', '') + "]");
    switch (msg.payload.command.replace(/^#/g, '').replace(/\s/g, '')) {
        case shared_interfaces_1.RESICMD.LAMP.name:
            switch (msg.payload.action.replace(':', '')) {
                case shared_interfaces_1.DALICMD.QUERY_STATUS.name:
                    result = decodeDALIQueryStatusResp(repTokenized[0], repTokenized[1]);
                    break;
                case shared_interfaces_1.DALICMD.QUERY_CONTROL_GEAR_PRESENT.name:
                case shared_interfaces_1.DALICMD.QUERY_ACTUAL_LEVEL.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1]);
                    break;
            }
            break;
        default:
            result.done = (shared_interfaces_1.RESIRESP.OK.name == repTokenized[0]);
            break;
    }
    //    console.log( JSON.stringify( result ) )
    return (result);
}
exports.prepareDALIResponse = prepareDALIResponse;
//# sourceMappingURL=shared-functions.js.map