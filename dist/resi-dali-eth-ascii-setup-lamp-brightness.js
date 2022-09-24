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
const daliLampLevelNodeName = "dali-setup-lamp-brightness";
const validDALICmd = [
    shared_interfaces_1.DALICMD.STORE_THE_DTR_AS_MIN_LEVEL.name,
    shared_interfaces_1.DALICMD.STORE_THE_DTR_AS_MAX_LEVEL.name,
    shared_interfaces_1.DALICMD.STORE_DTR_AS_POWER_ON_LEVEL.name,
    shared_interfaces_1.DALICMD.STORE_DTR_AS_SYSTEM_FAILURE_LEVEL.name,
    shared_interfaces_1.DALICMD.STORE_DTR_AS_FADERATE.name,
    shared_interfaces_1.DALICMD.STORE_DTR_AS_FADETIME.name
];
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
            if (!(isValid && Object.prototype.hasOwnProperty.call(msg.payload, 'lamp'))) {
                message = '\'lamp\' attribute Not Found';
                isValid = false;
            }
            else if (!(isValid && Object.prototype.hasOwnProperty.call(msg.payload, 'command'))) {
                message = '\'daliCommand\' attribute Not Found';
                isValid = false;
            }
            else if (!(isValid && Object.prototype.hasOwnProperty.call(msg.payload, 'level'))) {
                message = '\'level\' attribute Not Found';
                isValid = false;
            }
            if (message)
                node.error(message + " " + JSON.stringify(msg.payload), msg);
            return (message);
        };
        const rollback = function (lamp, level, msg) {
            if (level == 0) {
                return (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_OFF.name + lamp, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP_LEVEL.name, ''));
            }
            else {
                return (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_LEVEL.name + lamp + '=' + level, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP_LEVEL.name, ''));
            }
        };
        // const retrieveDaliData = function( msg : any ) : Promise<RESIResponseInterface> {
        //     return new Promise( ( resolve, reject ) => {
        //             // OK Command is valid
        //             executeRESICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_ACTUAL_LEVEL.opcode, 
        //                 buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_ACTUAL_LEVEL.name ) )
        //             .then( ( lampLevelResponse : any) => {
        //                 executeRESICommand( nodeServer, RESICMD.LAMP_LEVEL.name
        //                     + msg.payload.lamp + '=' 
        //                     + msg.payload.level, 
        //                     buildRequestNodeMessage( msg, RESICMD.LAMP_LEVEL.name, '' ))
        //                 .then( ( setLampLevelResponse : any ) => {
        //                     executeRESICommand( nodeServer, RESICMD.LAMP_COMMAND.name
        //                         + msg.payload.lamp + '=' 
        //                         + DALICMD.STORE_ACTUAL_LEVEL_IN_DTR.opcode, 
        //                         buildRequestNodeMessage( msg, RESICMD.LAMP_COMMAND.name, DALICMD.STORE_ACTUAL_LEVEL_IN_DTR.name ))
        //                     .then( () => {
        //                         executeRESICommand( nodeServer, RESICMD.LAMP_COMMAND.name
        //                             + msg.payload.lamp + '=' 
        //                             + DALICMD[ msg.payload.command.replace(/ /g,"_") ].opcode, 
        //                             buildRequestNodeMessage( msg, RESICMD.LAMP_COMMAND.name, DALICMD[ msg.payload.command.replace(/ /g,"_") ].name ))
        //                         .then( ( response ) => {
        //                             var result = Object.assign({}, msg) ;
        //                             result = objectRename( result, 'payload', 'daliRequest' ) ;
        //                             result.payload = response.payload ;
        //                             rollback( msg.payload.lamp, lampLevelResponse.payload.actualLampLevel, msg )
        //                             .then( () => {
        //                                 send( result ) ;
        //                                 done() ;
        //                             }).catch( () => {
        //                                 send( result ) ;
        //                                 done() ;
        //                             });
        //                         }).catch( ( e ) => {
        //                             // Roll back
        //                             node.error( "rollback1 " + e, msg ) ;
        //                             rollback( msg.payload.lamp, lampLevelResponse.payload.actualLampLevel, msg )
        //                             .then( () => {
        //                                 send( buildErrorNodeMessage( msg, e ) ) ;
        //                                 done()
        //                             }).catch( (e) => {
        //                             }) ;
        //                         }) ;
        //                     })
        //                     .catch( (e) => {
        //                         // Rollback
        //                         node.error( "rollback2 " + e, msg ) ;
        //                     }) ;
        //                 }).catch( (e) => {
        //                     // Rollback
        //                     node.error( "rollback3 " + e, msg ) ;
        //                 }) ;
        //             }).catch( ( message ) => {
        //                 send( message ) ; done() ;
        //             }) ;
        //     });
        // } ;
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
            if (!isInvalidMessageIn) {
                if (validDALICmd.indexOf(msg.payload.command) > -1) {
                    if (nodeServer.connection.isSystemConsole())
                        nodeServer.log('LAMP ' + msg.payload.lamp
                            + ' value ' + msg.payload.level
                            + ' command ' + msg.payload.command.split(' ').join('_'));
                    (0, shared_functions_1.testBusAvailability)(nodeServer, msg)
                        .then(() => {
                        // Load value in DTR
                        (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.DALI_CMD16.name + shared_interfaces_1.DALICMD.SET_DTR.opcode + (0, shared_functions_1.toHexString)(msg.payload.level), (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.DALI_CMD16.name, shared_interfaces_1.DALICMD.SET_DTR.name))
                            .then((response) => {
                            // Store data
                            let cmd = msg.payload.command.split(' ').join('_');
                            let storeCmd = shared_interfaces_1.RESICMD.LAMP_COMMAND_REPEAT.name + msg.payload.lamp + "=" + shared_interfaces_1.DALICMD[cmd].opcode;
                            (0, shared_functions_1.executeDALICommand)(nodeServer, storeCmd, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP_COMMAND_REPEAT.name, shared_interfaces_1.DALICMD[cmd].name))
                                .then((response) => {
                                if (response.payload.done && typeof response.payload.timeout == 'undefined') {
                                    send(response);
                                    done();
                                }
                                else {
                                    // Timeout
                                    send(response);
                                    done();
                                }
                            }).catch(() => {
                                send((0, shared_functions_1.buildErrorNodeMessage)(msg, 'Error occurred : Executing ' + shared_interfaces_1.DALICMD[cmd].name));
                                done();
                            });
                        }).catch((error) => {
                            console.log(error);
                            send((0, shared_functions_1.buildErrorNodeMessage)(msg, 'Error occurred : Setting DTR.'));
                            done();
                        });
                    }).catch(() => {
                        send((0, shared_functions_1.buildErrorNodeMessage)(msg, 'Error occurred :  DALI Bus unavailable.'));
                        done();
                    });
                }
                else {
                    node.error('Invalid command', msg);
                    send((0, shared_functions_1.buildErrorNodeMessage)(msg, 'Invalid command'));
                }
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
//# sourceMappingURL=resi-dali-eth-ascii-setup-lamp-brightness.js.map