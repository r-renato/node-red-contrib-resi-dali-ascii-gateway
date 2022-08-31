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
const daliLampLevelNodeName = "dali-lamp-color";
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
            if (!(isValid && Object.prototype.hasOwnProperty.call(msg.payload, 'color'))) {
                node.error('color attribute Not Found', msg);
                isValid = false;
            }
            return (isValid);
        };
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
                (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_ACTUAL_LEVEL.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_ACTUAL_LEVEL.name))
                    .then((lampLevelResponse) => {
                    console.log("lampLevelResponse: " + JSON.stringify(lampLevelResponse));
                    if (typeof lampLevelResponse.payload.timeout === 'undefined') {
                        var cmd = shared_interfaces_1.RESICMD.LAMP_RGBWAF.name
                            + msg.payload.lamp + ','
                            + lampLevelResponse.value.payload.actualLampLevel + ','
                            + msg.payload.actualLampLevel;
                        console.log("in: " + cmd);
                        (0, shared_functions_1.executeDALICommand)(nodeServer, cmd, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP_RGBWAF.name, ''))
                            .then((response) => {
                            console.log("response: " + JSON.stringify(response));
                        }).catch((error) => {
                            console.log("in: " + error);
                        });
                    }
                    else {
                        // Error
                        console.log("ou: ");
                    }
                }).catch((error) => {
                });
                // Promise.allSettled([
                //     executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_STATUS.opcode, 
                //         buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_STATUS.name ) ),
                //     executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_ACTUAL_LEVEL.opcode, 
                //         buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_ACTUAL_LEVEL.name ) ),
                // ]).then( ( responses ) => {
                //     let result1 = (<any> responses[ 0 ]).value.daliRequest.action == DALICMD.QUERY_STATUS.name 
                //         ? (<any> responses[ 0 ]).value : (<any> responses[ 1 ]).value ;
                //     let result2 = (<any> responses[ 0 ]).value.daliRequest.action == DALICMD.QUERY_ACTUAL_LEVEL.name 
                //         ? (<any> responses[ 0 ]).value : (<any> responses[ 1 ]).value ;
                //     result1 = objectRename( result1, 'daliRequest', 'daliRequest1' ) ;
                //     result1.daliRequest2 = Object.assign({}, result2.daliRequest) ;
                //     result1 = objectRename( result1, 'payload', 'daliResponse1' ) ;
                //     result1.daliResponse2 = Object.assign({}, result2.payload) ;
                //     // console.log( "result1 => " + JSON.stringify( result1 ) ) ;
                //     // console.log( "result2 => " + JSON.stringify( result2 ) ) ;
                //     result1.payload = {
                //         done : true
                //     } ;
                //     if( typeof result1.daliResponse1.timeout == 'undefined' && typeof result1.daliResponse2.timeout == 'undefined' ) {
                //         result1.payload.powerOn = result1.daliResponse1.lampArcPowerOn ;
                //         result1.payload.level = result1.daliResponse2.value ;
                //         result1.payload.isPowerOn = ( result1.daliResponse1.lampArcPowerOn && result1.daliResponse2.value > 0 ) ;
                //     } else {
                //         result1.payload.timeout = true ;
                //     }
                //     send( <nodered.NodeMessage> result1 ) ;
                // }).catch( ( e ) => {
                //     console.log( 'erroreeee' + e ) ;
                // }) ;
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
//# sourceMappingURL=resi-dali-eth-ascii-lamp-color.js.map