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
const daliLampLevelNodeName = "dali-query-lamp-power-on";
//const telnetEngingLib = require( "telnet-engine" ) ;
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
        node.log("isSystemConsole: " + nodeServer.connection.isSystemConsole());
        if (nodeServer) {
            status = new shared_classes_1.Status(node, nodeServer);
            resiClient = nodeServer.connection;
            status.setStatus(false);
        }
        const executeDALICommand = function (textCommand, msg) {
            return new Promise((resolve, reject) => {
                nodeServer.connection.send(textCommand).then((response) => {
                    console.log(">>> " + JSON.stringify(response));
                    var result = Object.assign({}, msg);
                    result = (0, shared_functions_1.objectRename)(result, 'payload', 'daliRequest');
                    result.payload = (0, shared_functions_1.prepareDALIResponse)(msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, ''));
                    result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '');
                    //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
                    resolve(result);
                });
            });
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
                if (resiClient.isSystemConsole()) {
                    node.log("Try to sending command: " + queryStatusCmd);
                    node.log("Try to sending command: " + queryActualLevel);
                }
                let msg1 = Object.assign({}, msg);
                msg1.payload = {};
                msg1.payload.command = 'LAMP';
                msg1.payload.action = 'QUERY STATUS';
                msg1.payload.params = '';
                let msg2 = Object.assign({}, msg);
                msg2.payload = {};
                msg2.payload.command = 'LAMP';
                msg2.payload.action = 'QUERY ACTUAL LEVEL';
                msg2.payload.params = '';
                Promise.allSettled([
                    executeDALICommand(queryStatusCmd, msg1),
                    executeDALICommand(queryActualLevel, msg2)
                ]).then((responses) => {
                    let result1 = responses[0].value.daliRequest.action == 'QUERY STATUS'
                        ? responses[0].value : responses[1].value;
                    let result2 = responses[0].value.daliRequest.action == 'QUERY ACTUAL LEVEL'
                        ? responses[0].value : responses[1].value;
                    console.log("result1 => " + JSON.stringify(result1));
                    console.log("result2 => " + JSON.stringify(result2));
                }).catch((e) => {
                    console.log('erroreeee' + e);
                });
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
//# sourceMappingURL=resi-dali-eth-ascii-query-lamp-power-on.js.map