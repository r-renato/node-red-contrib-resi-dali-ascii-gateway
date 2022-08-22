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
const daliLampLevelNodeName = "dali-lamp-level";
const telnetEngingLib = require("telnet-engine");
module.exports = function (RED) {
    RED.nodes.registerType(daliLampLevelNodeName, function (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var nodeServer = RED.nodes.getNode(config.server);
        var telnetEngine;
        var status;
        if (nodeServer) {
            status = new shared_classes_1.Status(node, nodeServer);
            telnetEngine = nodeServer.connection;
            status.setStatus(false);
        }
        /**
         *
         */
        this.on("input", (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            if (telnetEngine) {
                status.setStatus(true);
                console.log("log: " + telnetEngine.systemConsole);
                if (telnetEngine.systemConsole) {
                    telnetEngine.engine.listenString(node.log);
                }
                var textCommand = "#LAMP LEVEL:"
                    + (msg.payload.lamp | config.lamp)
                    + "="
                    + (msg.payload.level | config.level);
                telnetEngine.proxy.request({
                    request: textCommand.toString(),
                    test: telnetEngingLib.untilMilli(1500),
                    foo: (obj) => {
                        var result = Object.assign({}, msg);
                        result = (0, shared_functions_1.objectRename)(result, 'payload', 'daliRequest');
                        if (obj.response == "#OK") {
                        }
                        else {
                            // Error
                        }
                        console.log(">" + obj.response + "<");
                        var msg1 = Object.assign({}, msg);
                        msg1.payload = obj.response;
                        send([result, ,]);
                        return obj.response.length;
                    }, UID: "REQ123"
                })
                    .then(() => {
                    console.log("done.");
                })
                    .catch(() => {
                    console.log("error:", "REQ123");
                });
            }
            done();
        }));
        /**
         *
         */
        this.on("close", () => __awaiter(this, void 0, void 0, function* () {
            if (telnetEngine.systemConsole) {
                node.log("close");
            }
            if (telnetEngine) {
                if (status.getStatusBroadcasting()) {
                    status.getStatusBroadcasting().resolve();
                }
            }
        }));
    });
};
//# sourceMappingURL=resi-dali-eth-ascii-lamp-level.js.map