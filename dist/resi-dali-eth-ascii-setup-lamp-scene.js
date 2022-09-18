"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const shared_interfaces_1 = require("./shared-interfaces");
const shared_functions_1 = require("./shared-functions");
const daliLampLevelNodeName = "dali-setup-lamp-scene";
// const validDALICmd : string[] = [
//     <string>DALICMD.STORE_THE_DTR_AS_MIN_LEVEL.name,
//     <string>DALICMD.STORE_THE_DTR_AS_MAX_LEVEL.name,
//     <string>DALICMD.STORE_DTR_AS_POWER_ON_LEVEL.name,
//     <string>DALICMD.STORE_DTR_AS_SYSTEM_FAILURE_LEVEL.name,
//     <string>DALICMD.STORE_DTR_AS_FADERATE.name,
//     <string>DALICMD.STORE_DTR_AS_FADETIME.name
// ] ;
module.exports = function (RED) {
    RED.nodes.registerType(daliLampLevelNodeName, function (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var nodeServer = RED.nodes.getNode(config.server);
        var resiClient;
        var status;
        const invalidMessageIn = function (msg) {
            let isValid = true;
            let message = null;
            if (!(isValid && Object.prototype.hasOwnProperty.call(msg.payload, 'deviceType'))) {
                message = '\'deviceType\' attribute Not Found';
                isValid = false;
            }
            if (!(isValid && Object.prototype.hasOwnProperty.call(msg.payload, 'scene'))) {
                message = '\'scene\' attribute Not Found';
                isValid = false;
            }
            // if( isValid ) {
            //     switch(  msg.payload.deviceType ) {
            //         case 8:
            //             if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'command' )) ) { 
            //                 message = '\'daliCommand\' attribute Not Found' ;
            //                 isValid = false ;
            //             } else 
            //             if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'level' )) ) { 
            //                 message = '\'level\' attribute Not Found' ;
            //                 isValid = false ;
            //             }
            //             break ;
            //     }
            // }
            if (message)
                node.error(message + " " + JSON.stringify(msg.payload), msg);
            return (message);
        };
        const setXYCoordinate = function (msg, deviceType, value, xy_dalicmd) {
            return new Promise((resolve, reject) => {
                Promise.allSettled([
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR.opcode + "0".toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR1.opcode + value.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR1.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.ENABLE_DEVICE_TYPE.opcode + deviceType.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.ENABLE_DEVICE_TYPE.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + xy_dalicmd.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, xy_dalicmd.name))
                ]).then((responses) => {
                    console.log('setXYCoordinate: ' + JSON.stringify(responses));
                    let payloadDTR = responses[0].payload;
                    let payloadDTR1 = responses[1].payload;
                    let payloadEnableDT = responses[2].payload;
                    let payloadTmpStore = responses[3].payload;
                    if (typeof payloadDTR.timeout === 'undefined' && typeof payloadDTR1.timeout === 'undefined'
                        && typeof payloadEnableDT.timeout === 'undefined' && typeof payloadTmpStore.timeout === 'undefined') {
                        console.log('resolve setXYCoordinate: ' + JSON.stringify(responses));
                        resolve(payloadDTR);
                    }
                    else {
                        console.log('reject setXYCoordinate: ' + JSON.stringify(responses));
                        reject(payloadDTR);
                    }
                }).catch((error) => {
                    console.log('setXYCoordinate: ' + JSON.stringify(error));
                    reject(error);
                });
            });
        };
        const setColourTemperature = function (msg, deviceType, value) {
            var promise = new Promise((resolve, reject) => {
                Promise.all([
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR.opcode + "0".toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR1.opcode + value.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR1.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.ENABLE_DEVICE_TYPE.opcode + deviceType.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.ENABLE_DEVICE_TYPE.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.DT8_SET_COLOUR_TEMPERATURE_TC.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.DT8_SET_COLOUR_TEMPERATURE_TC.name))
                ]).then(() => {
                    resolve();
                }).catch(() => {
                    reject();
                });
            });
        };
        const setPrimaryNDimLevel = function (msg, deviceType, value, channel) {
            var promise = new Promise((resolve, reject) => {
                Promise.all([
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR.opcode + "0".toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR1.opcode + value.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR1.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR2.opcode + channel.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR2.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.ENABLE_DEVICE_TYPE.opcode + deviceType.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.ENABLE_DEVICE_TYPE.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.DT8_SET_PRIMARY_N_DIMLEVEL.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.DT8_SET_PRIMARY_N_DIMLEVEL.name))
                ]).then(() => {
                    resolve();
                }).catch(() => {
                    reject();
                });
            });
        };
        const setRGBDimLevel = function (msg, deviceType, r, g, b) {
            var promise = new Promise((resolve, reject) => {
                Promise.all([
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR.opcode + r.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR1.opcode + g.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR1.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR2.opcode + b.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR2.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.ENABLE_DEVICE_TYPE.opcode + deviceType.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.ENABLE_DEVICE_TYPE.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.DT8_SET_RGB_DIMLEVEL.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.DT8_SET_RGB_DIMLEVEL.name))
                ]).then(() => {
                    resolve();
                }).catch(() => {
                    reject();
                });
            });
        };
        const setWAFDimLevel = function (msg, deviceType, w, a) {
            var promise = new Promise((resolve, reject) => {
                Promise.allSettled([
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR.opcode + w.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR1.opcode + a.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR1.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR2.opcode + "0".toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR2.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.ENABLE_DEVICE_TYPE.opcode + deviceType.toString().padStart(2, "0"), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.ENABLE_DEVICE_TYPE.name)),
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.DT8_SET_WAF_DIMLEVEL.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.DT8_SET_WAF_DIMLEVEL.name))
                ]).then((responses) => {
                    resolve();
                }).catch(() => {
                    reject();
                });
            });
        };
        /**
         *
         */
        this.on("input", (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            if ((0, shared_functions_1.invalidPayloadIn)(msg) || !nodeServer) {
                node.error('payload Not Found', msg);
                send((0, shared_functions_1.buildErrorNodeMessage)(msg, 'payload Not Found'));
                done();
                return;
            }
            let isInvalidMessageIn = invalidMessageIn(msg);
            let deviceType = msg.payload.deviceType;
            let scene = msg.payload.scene;
            if (!isInvalidMessageIn) {
                Promise.allSettled([
                    (typeof msg.payload.xCoordinate != 'undefined'
                        ? setXYCoordinate(msg, deviceType, msg.payload.xCoordinate, shared_interfaces_1.DALICMD.DT8_SET_TEMPORARY_X_COORDINATE) : undefined),
                    (typeof msg.payload.yCoordinate != 'undefined'
                        ? setXYCoordinate(msg, deviceType, msg.payload.yCoordinate, shared_interfaces_1.DALICMD.DT8_SET_TEMPORARY_Y_COORDINATE) : undefined)
                ]).then((responses) => {
                    console.log('onInput' + JSON.stringify(responses));
                    done();
                });
            }
            else {
                send((0, shared_functions_1.buildErrorNodeMessage)(msg, isInvalidMessageIn));
                done();
            }
        }));
        /**
         *
         */
        this.on("close", (done) => __awaiter(this, void 0, void 0, function* () {
            if (nodeServer && resiClient) {
                if (resiClient.isSystemConsole()) {
                    node.log("close");
                }
                if (resiClient) {
                    if (status.getStatusBroadcasting()) {
                        status.getStatusBroadcasting().resolve();
                    }
                }
            }
            done();
        }));
    });
};
//# sourceMappingURL=resi-dali-eth-ascii-setup-lamp-scene.js.map