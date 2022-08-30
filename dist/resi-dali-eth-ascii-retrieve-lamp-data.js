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
const shared_classes_1 = require("./shared-classes");
const shared_functions_1 = require("./shared-functions");
const daliLampLevelNodeName = "dali-retrieve-lamp-data";
module.exports = function (RED) {
    RED.nodes.registerType(daliLampLevelNodeName, function (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var nodeServer = RED.nodes.getNode(config.server);
        var resiClient;
        var status;
        const isValidDALIMsg = function (msg) {
            let isValid = true;
            if (!(isValid && Object.prototype.hasOwnProperty.call(msg.payload, 'lamp'))) {
                node.error('lamp attribute Not Found', msg);
                isValid = false;
            }
            return (isValid);
        };
        //node.log( "isSystemConsole: " + nodeServer.connection.isSystemConsole() ) ;
        if (nodeServer) {
            status = new shared_classes_1.Status(node, nodeServer);
            resiClient = nodeServer.connection;
            status.setStatus(false);
        }
        // const executeDALICommand = function( textCommand : string, msg : any ) : Promise<nodered.NodeMessage> {
        //     return new Promise( ( resolve, reject ) => {
        //         if( resiClient.isSystemConsole() ) node.log( "Try to sending command: " + textCommand ) ;
        //         nodeServer.connection.send( textCommand ).then( ( response ) => {
        //             //console.log( ">>> " + JSON.stringify( response ) ) ;
        //             var result = <RESIResponseInterface> Object.assign({}, msg)
        //             result = objectRename( result, 'payload', 'daliRequest' ) ;
        //             result.payload = prepareDALIResponse( msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ) ;
        //             result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
        //             //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
        //             resolve(<nodered.NodeMessage> result) ;
        //         })
        //     }) ;
        // }
        // const prepareNodeMessage = function( srcmsg : any, command : string, action: string ) : any {
        //     let msg =  Object.assign({}, srcmsg) ; msg.payload = {} ;
        //     msg.payload.command = command ; msg.payload.action = action ; msg.payload.params = ':' + srcmsg.payload.lamp ;
        //     return( msg ) ;
        // }
        /**
         *
         */
        this.on("input", (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            if ((0, shared_functions_1.invalidPayloadIn)(msg) || !nodeServer) {
                node.error('payload Not Found', msg);
                //TODO
                // Va restituito un errore
                done();
                return;
            }
            if (isValidDALIMsg(msg)) {
                var queryStatusCmd = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0x90';
                var queryActualLevel = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0xA0';
                var queryActualLevel = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0x99';
                (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_CONTROL_GEAR_PRESENT.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_CONTROL_GEAR_PRESENT.name))
                    .then((response) => {
                    //console.log( "response: " + JSON.stringify( response ) ) ;
                    if (response.payload.done && typeof response.payload.timeout == 'undefined') {
                        // ok
                        Promise.allSettled([
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_STATUS.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_STATUS.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_ACTUAL_LEVEL.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_ACTUAL_LEVEL.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_DEVICE_TYPE.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_DEVICE_TYPE.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_PHYSICAL_MINIMUM.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_PHYSICAL_MINIMUM.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_MIN_LEVEL.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_MIN_LEVEL.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_MAX_LEVEL.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_MAX_LEVEL.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_POWER_ON_LEVEL.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_POWER_ON_LEVEL.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_SYSTEM_FAILURE_LEVEL.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_SYSTEM_FAILURE_LEVEL.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_FADE_TIME_FADE_RATE.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_FADE_TIME_FADE_RATE.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_GROUPS_0_7.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_GROUPS_0_7.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_GROUPS_8_15.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_GROUPS_8_15.name)),
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_QUERY_RGBWAF.name + msg.payload.lamp + ',6', (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP_QUERY_RGBWAF.name, '')),
                        ]).then((responses) => {
                            var result = Object.assign({}, msg);
                            result = (0, shared_functions_1.objectRename)(result, 'payload', 'daliRequest');
                            let payload = {
                                status: responses[0].value.payload,
                                actualLampLevel: responses[1].value.payload.actualLampLevel,
                                deviceType: responses[2].value.payload,
                                physicalMinimumLevel: responses[3].value.payload.physicalMinimumLevel,
                                minLevel: responses[4].value.payload.minLevel,
                                maxLevel: responses[5].value.payload.maxLevel,
                                powerOnLevel: responses[6].value.payload.powerOnLevel,
                                systemFailureLevel: responses[7].value.payload.systemFailureLevel,
                                fadeTimeFadeRate: responses[8].value.payload.fadeTimeFadeRate,
                                groups: Object.assign(Object.assign({}, responses[9].value.payload.groups), responses[10].value.payload.groups)
                            };
                            delete payload.status['done'];
                            delete payload.status['raw'];
                            delete payload.deviceType['done'];
                            delete payload.deviceType['raw'];
                            result.payload = payload;
                            console.log("responses: " + JSON.stringify(responses));
                            send(result);
                            done();
                        }).catch((error) => {
                            console.log(error);
                            done();
                        });
                    }
                    else {
                        // Timeout
                        send(response);
                        done();
                    }
                }).catch(() => {
                    done();
                });
            }
            else {
                node.error('payload Not Found', msg);
                //TODO
                // Va restituito un errore
                done();
                return;
            }
        }));
        /**
         *
         */
        this.on("close", (done) => __awaiter(this, void 0, void 0, function* () {
            if (nodeServer) {
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
//# sourceMappingURL=resi-dali-eth-ascii-retrieve-lamp-data.js.map