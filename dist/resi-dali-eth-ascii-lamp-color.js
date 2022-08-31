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
                        if (lampLevelResponse.payload.actualLampLevel > 0) {
                            (0, shared_functions_1.executeDALICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_RGBWAF.name
                                + msg.payload.lamp + ','
                                + lampLevelResponse.payload.actualLampLevel + ','
                                + msg.payload.color, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP_RGBWAF.name, ''))
                                .then((response) => {
                                console.log("response: " + JSON.stringify(response));
                                var result = Object.assign({}, msg);
                                result = (0, shared_functions_1.objectRename)(msg, 'payload', 'daliRequest');
                                result.payload = response.payload;
                                send(result);
                                done();
                            }).catch((error) => {
                                // Error timeout
                                var result = Object.assign({}, msg);
                                result = (0, shared_functions_1.objectRename)(msg, 'payload', 'daliRequest');
                                result.payload = lampLevelResponse.payload;
                                send((0, shared_functions_1.buildErrorNodeMessage)(result, ' '));
                            });
                        }
                        else {
                            var result = Object.assign({}, msg);
                            result = (0, shared_functions_1.objectRename)(msg, 'payload', 'daliRequest');
                            result.payload = lampLevelResponse.payload;
                            send((0, shared_functions_1.buildErrorNodeMessage)(msg, 'Actual Lamp Level is zero (0)'));
                            done();
                        }
                    }
                    else {
                        // Error timeout
                        var result = Object.assign({}, msg);
                        result = (0, shared_functions_1.objectRename)(msg, 'payload', 'daliRequest');
                        result.payload = lampLevelResponse.payload;
                        send((0, shared_functions_1.buildErrorNodeMessage)(result, ' '));
                    }
                }).catch((error) => {
                    if (nodeServer && resiClient) {
                        if (resiClient.isSystemConsole())
                            console.log(error);
                    }
                    send((0, shared_functions_1.buildErrorNodeMessage)(msg, '', error));
                });
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