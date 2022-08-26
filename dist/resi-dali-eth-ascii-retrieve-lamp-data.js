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
        const executeDALICommand = function (textCommand, msg) {
            return new Promise((resolve, reject) => {
                if (resiClient.isSystemConsole())
                    node.log("Try to sending command: " + textCommand);
                nodeServer.connection.send(textCommand).then((response) => {
                    //console.log( ">>> " + JSON.stringify( response ) ) ;
                    var result = Object.assign({}, msg);
                    result = (0, shared_functions_1.objectRename)(result, 'payload', 'daliRequest');
                    result.payload = (0, shared_functions_1.prepareDALIResponse)(msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, ''));
                    result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '');
                    //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
                    resolve(result);
                });
            });
        };
        const prepareNodeMessage = function (srcmsg, command, action) {
            let msg = Object.assign({}, srcmsg);
            msg.payload = {};
            msg.payload.command = command;
            msg.payload.action = action;
            msg.payload.params = ':' + srcmsg.payload.lamp;
            return (msg);
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
                var queryStatusCmd = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0x90';
                var queryActualLevel = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0xA0';
                var queryActualLevel = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0x99';
                executeDALICommand(shared_classes_1.RESICMD.LAMP_COMMAND_ANSWER + msg.payload.lamp + '=' + shared_classes_1.DALICMD.QUERY_CONTROL_GEAR_PRESENT.opcode, prepareNodeMessage(msg, shared_classes_1.RESICMD.LAMP.name, shared_classes_1.DALICMD.QUERY_CONTROL_GEAR_PRESENT.name))
                    .then((response) => {
                    console.log(JSON.stringify(response));
                    done();
                }).catch(() => {
                });
                // Promise.allSettled([
                //     executeDALICommand( RESICMD.LAMP_COMMAND_ANSWER + msg.payload.lamp + '=' + DALICMD.QUERY_STATUS.opcode, 
                //         prepareNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_STATUS.name ) ),
                //     executeDALICommand( lampCommandAnswerCommandConst + msg.payload.lamp + '=0xA0', 
                //         prepareNodeMessage( msg, defaultCommandConst, queryActualLevelCommandConst) ),
                //     executeDALICommand( queryStatusCmd, msg1 ),
                //     executeDALICommand( queryActualLevel, msg2)
                // ]).then( ( responses ) => {
                //     let result1 = (<any> responses[ 0 ]).value.daliRequest.action == 'QUERY STATUS' 
                //         ? (<any> responses[ 0 ]).value : (<any> responses[ 1 ]).value ;
                //     let result2 = (<any> responses[ 0 ]).value.daliRequest.action == 'QUERY ACTUAL LEVEL' 
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
                //status.setStatus( true ) ;
                // nodeServer.connection.send( textCommand ).then( ( response ) => {
                //     var result = <RESIResponseInterface> Object.assign({}, msg) ;
                //     result = objectRename( result, 'payload', 'daliRequest' ) ;
                //     result.payload = prepareDALIResponse( msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ) ;
                //     result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
                //     //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
                //     send(<nodered.NodeMessage> result) ;
                // }).catch( ( error ) => {
                //     var result : any = Object.assign({}, msg) ;
                //     result.error = {
                //         message : error,
                //         source : {
                //             id : nodeServer.id,
                //             type : nodeServer.type,
                //             name : nodeServer.name
                //         }
                //     } ;
                //     send([result, ,])
                // }) ;
                done();
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