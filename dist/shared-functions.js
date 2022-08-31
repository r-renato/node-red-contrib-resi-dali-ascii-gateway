"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildErrorNodeMessage = exports.buildRequestNodeMessage = exports.executeDALICommand = exports.prepareDALIResponse = exports.invalidPayloadIn = exports.promiseState = exports.requestTimeout = exports.objectRename = void 0;
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
/**
 *
 * @param value
 * @param bitPos
 * @returns
 */
function isSet(value, bitPos) {
    var result = Math.floor(value / Math.pow(2, bitPos)) % 2;
    return result == 1;
}
function prepareDALIResponse(msg, response) {
    /**
     *
     * @param prefix
     * @param suffix
     * @returns
     */
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
                      Bit 0: Status of control gear 0=OK
                      Bit 1: Lamp failure 0=OK
                      Bit 2: Lamp arc power on 0=OFF 1=ON
                      Bit 3: Limit Error 0=Actual level is between MIN and MAX or OFF
                      Bit 4: Fade running 0=Fading is finished 1=Fading is active
                      Bit 5: RESET STATE 0=OK
                      Bit 6: Missing short address 0=No 1=Yes
                      Bit 7: POWER FAILURE 0=No
                */
                statusControlGear: !isSet(resp, 0),
                lampFailure: !isSet(resp, 1),
                lampArcPowerOn: isSet(resp, 2),
                queryLimitError: isSet(resp, 3),
                fadeRunning: isSet(resp, 4),
                queryResetState: !isSet(resp, 5),
                queryMissingShortAddress: isSet(resp, 6),
                queryPowerFailure: isSet(resp, 7) // Bit 7: POWER FAILURE 0=No
            };
        }
        ;
        result.done = (shared_interfaces_1.RESIRESP.OK.name == prefix);
        if (shared_interfaces_1.RESIRESP.OK.name == prefix && code == 9)
            result.timeout = (shared_interfaces_1.RESIRESP.OK.name == prefix && code == 9);
        return (result);
    }
    function decodeDALIGroup(value, start) {
        let result = {};
        let i = -1;
        i++;
        result['group' + (start + i)] = isSet(value, i);
        i++;
        result['group' + (start + i)] = isSet(value, i);
        i++;
        result['group' + (start + i)] = isSet(value, i);
        i++;
        result['group' + (start + i)] = isSet(value, i);
        i++;
        result['group' + (start + i)] = isSet(value, i);
        i++;
        result['group' + (start + i)] = isSet(value, i);
        i++;
        result['group' + (start + i)] = isSet(value, i);
        i++;
        result['group' + (start + i)] = isSet(value, i);
        console.log("result>> " + JSON.stringify(result));
        return (result);
    }
    /**
     *
     * @param prefix
     * @param suffix
     * @returns
     */
    function decodeDALIResp(prefix, suffix, attribute) {
        let data = suffix.split(',');
        let result = {};
        result.done = (shared_interfaces_1.RESIRESP.OK.name == prefix);
        if (data.length > 1) {
            let code = parseInt(data[0]);
            let resp = parseInt(data[1]);
            result[attribute] = resp;
            if (shared_interfaces_1.RESIRESP.OK.name == prefix && code == 9)
                result.timeout = (shared_interfaces_1.RESIRESP.OK.name == prefix && code == 9);
        }
        //console.log( "decodeDALIResp: " + result ) ;
        return (result);
    }
    /**
     *  Main function
     */
    let result = {};
    let repTokenized = response.split(':');
    // console.log( "prepareDALIResponse: " + JSON.stringify( msg ) + " / " + repTokenized
    //   + "[" + msg.payload.command + "]" 
    //   + "[" + msg.payload.action.replace(':', '') + "]" ) ;
    switch (msg.payload.command) {
        case shared_interfaces_1.RESICMD.LAMP.name:
            // console.log( '>>LAMP<<') ;
            switch (msg.payload.action.replace(':', '')) {
                case shared_interfaces_1.DALICMD.QUERY_STATUS.name:
                    result = decodeDALIQueryStatusResp(repTokenized[0], repTokenized[1]);
                    break;
                case shared_interfaces_1.DALICMD.QUERY_DEVICE_TYPE.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'deviceType');
                    result['deviceTypeName'] = shared_interfaces_1.DALI_DEVICE_TYPES[result.deviceType];
                    break;
                case shared_interfaces_1.DALICMD.QUERY_CONTROL_GEAR_PRESENT.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'isControlGearPresent');
                    result.isControlGearPresent = (result.isControlGearPresent == 255);
                    break;
                case shared_interfaces_1.DALICMD.QUERY_ACTUAL_LEVEL.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'actualLampLevel');
                    break;
                case shared_interfaces_1.DALICMD.QUERY_POWER_ON_LEVEL.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'powerOnLevel');
                    break;
                case shared_interfaces_1.DALICMD.QUERY_SYSTEM_FAILURE_LEVEL.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'systemFailureLevel');
                    break;
                case shared_interfaces_1.DALICMD.QUERY_FADE_TIME_FADE_RATE.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'fadeTimeFadeRate');
                    break;
                case shared_interfaces_1.DALICMD.QUERY_PHYSICAL_MINIMUM.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'physicalMinimumLevel');
                    break;
                case shared_interfaces_1.DALICMD.QUERY_MIN_LEVEL.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'minLevel');
                    break;
                case shared_interfaces_1.DALICMD.QUERY_MAX_LEVEL.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'maxLevel');
                    break;
                case shared_interfaces_1.DALICMD.QUERY_GROUPS_0_7.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'groups');
                    result.groups = decodeDALIGroup(result.groups, 0);
                    break;
                case shared_interfaces_1.DALICMD.QUERY_GROUPS_8_15.name:
                    result = decodeDALIResp(repTokenized[0], repTokenized[1], 'groups');
                    result.groups = decodeDALIGroup(result.groups, 8);
                    break;
            }
            break;
        case shared_interfaces_1.RESICMD.LAMP_QUERY_RGBWAF.name:
            if ('#LQRGBWAF' == repTokenized[0]) {
                if ('ERR' == repTokenized[1]) {
                    result.timeout = true;
                }
                else {
                    let data = repTokenized[1].split(',');
                    if (data.length == 8) {
                        result.done = true;
                        result.lamp = parseInt(data[0]);
                        result.arcPowerLevel = parseInt(data[1]);
                        result.color = {
                            r: parseInt(data[2]),
                            g: parseInt(data[3]),
                            b: parseInt(data[4]),
                            c: parseInt(data[5]),
                            w: parseInt(data[6]),
                            freeColor: parseInt(data[7])
                        };
                    }
                }
            }
            break;
        default:
            // console.log( '>>default<<') ;
            result.done = (shared_interfaces_1.RESIRESP.OK.name == repTokenized[0]);
            break;
    }
    //    console.log( JSON.stringify( result ) )
    return (result);
}
exports.prepareDALIResponse = prepareDALIResponse;
/**
 *
 * @param nodeClient
 * @param textCommand
 * @param msg
 * @returns Promise<nodered.NodeMessage>
 */
function executeDALICommand(nodeClient, textCommand, msg) {
    return new Promise((resolve, reject) => {
        if (nodeClient.connection.isSystemConsole())
            nodeClient.log("Try to sending command: " + textCommand);
        //nodeClient.connection.changeStateToConnect() ;
        nodeClient.connection.send(textCommand).then((response) => {
            //console.log( ">>> " + JSON.stringify( response ) ) ;
            var result = Object.assign({}, msg);
            result = objectRename(result, 'payload', 'daliRequest');
            result.payload = prepareDALIResponse(msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, ''));
            result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '');
            //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
            //nodeClient.connection.changeStateToIdle() ;
            resolve(result);
        }).catch((error) => {
            //nodeClient.connection.changeStateToError() ;
            reject(error);
        });
    });
}
exports.executeDALICommand = executeDALICommand;
/**
 *
 * @param msg
 * @param command
 * @param action
 * @returns
 */
function buildRequestNodeMessage(msg, command, action) {
    let newMsg = Object.assign({}, msg);
    newMsg.payload = {};
    newMsg.payload.command = command;
    newMsg.payload.action = action;
    newMsg.payload.params = ':' + msg.payload.lamp;
    return (newMsg);
}
exports.buildRequestNodeMessage = buildRequestNodeMessage;
function buildErrorNodeMessage(msg, message, error) {
    var result = Object.assign({}, msg);
    result.error = {};
    if (typeof error === 'undefined')
        result.error.message = message;
    else
        result.error.message = error;
    return (result);
}
exports.buildErrorNodeMessage = buildErrorNodeMessage;
//# sourceMappingURL=shared-functions.js.map