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
const daliLampLevelNodeName = "dali-generic";
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
            if (!(isValid && Object.prototype.hasOwnProperty.call(msg.payload, 'command'))) {
                node.error('command Not Found', msg);
                isValid = false;
            }
            if (!(isValid && Object.prototype.hasOwnProperty.call(msg.payload, 'action'))) {
                node.error('action Not Found', msg);
                isValid = false;
            }
            if (!(isValid && Object.prototype.hasOwnProperty.call(msg.payload, 'params'))) {
                node.error('params Not Found', msg);
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
                //status.setStatus( true ) ;
                var textCommand = "#"
                    + msg.payload.command.replace(/^\s+|\s+$/g, '')
                    + " "
                    + msg.payload.action.replace(/^\s+|\s+$/g, '')
                    + (msg.payload.params.replace(/^\s+|\s+$/g, '').length > 0
                        ? msg.payload.params.replace(/^\s+|\s+$/g, '') : '');
                if (resiClient.isSystemConsole())
                    node.log("Try to sending command: " + textCommand);
                nodeServer.connection.send(textCommand).then((response) => {
                    var result = Object.assign({}, msg);
                    result = (0, shared_functions_1.objectRename)(result, 'payload', 'daliRequest');
                    result.payload = (0, shared_functions_1.prepareDALIResponse)(msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, ''));
                    result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '');
                    //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
                    send(result);
                }).catch((error) => {
                    var result = Object.assign({}, msg);
                    result.error = {
                        message: error,
                        source: {
                            id: nodeServer.id,
                            type: nodeServer.type,
                            name: nodeServer.name
                        }
                    };
                    send([result, ,]);
                });
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
//# sourceMappingURL=resi-dali-eth-ascii-generic.js.map