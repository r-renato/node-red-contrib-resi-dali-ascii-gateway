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
            return (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_LEVEL.name + lamp + '=' + level, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP_LEVEL.name, ''));
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
            if (!isInvalidMessageIn) {
                if (validDALICmd.indexOf(msg.payload.command) > -1) {
                    // OK Command is valid
                    (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + shared_interfaces_1.DALICMD.QUERY_ACTUAL_LEVEL.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP.name, shared_interfaces_1.DALICMD.QUERY_ACTUAL_LEVEL.name))
                        .then((lampLevelResponse) => {
                        (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_LEVEL.name
                            + msg.payload.lamp + '='
                            + msg.payload.level, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP_LEVEL.name, ''))
                            .then((setLampLevelResponse) => {
                            (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND.name
                                + msg.payload.lamp + '='
                                + shared_interfaces_1.DALICMD.STORE_ACTUAL_LEVEL_IN_DTR.opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP_COMMAND.name, shared_interfaces_1.DALICMD.STORE_ACTUAL_LEVEL_IN_DTR.name))
                                .then(() => {
                                (0, shared_functions_1.executeRESICommand)(nodeServer, shared_interfaces_1.RESICMD.LAMP_COMMAND.name
                                    + msg.payload.lamp + '='
                                    + shared_interfaces_1.DALICMD[msg.payload.command.replace(/ /g, "_")].opcode, (0, shared_functions_1.buildRequestNodeMessage)(msg, shared_interfaces_1.RESICMD.LAMP_COMMAND.name, shared_interfaces_1.DALICMD[msg.payload.command.replace(/ /g, "_")].name))
                                    .then((response) => {
                                    console.log(JSON.stringify(msg));
                                    var result = Object.assign({}, msg);
                                    result = (0, shared_functions_1.objectRename)(msg, 'payload', 'daliRequest');
                                    result.payload = response.payload;
                                    rollback(msg.payload.lamp, lampLevelResponse.payload.actualLampLevel, msg)
                                        .then(() => {
                                        send(result);
                                        done();
                                    }).catch(() => {
                                        send(result);
                                        done();
                                    });
                                }).catch((e) => {
                                    // Roll back
                                    node.error("rollback1 " + e, msg);
                                    rollback(msg.payload.lamp, lampLevelResponse.payload.actualLampLevel, msg)
                                        .then(() => {
                                        send((0, shared_functions_1.buildErrorNodeMessage)(msg, e));
                                        done();
                                    }).catch((e) => {
                                    });
                                });
                            })
                                .catch((e) => {
                                // Rollback
                                node.error("rollback2 " + e, msg);
                            });
                        }).catch((e) => {
                            // Rollback
                            node.error("rollback3 " + e, msg);
                        });
                    }).catch((message) => {
                        send(message);
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