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
var telnetEngingLib = require("telnet-engine");
module.exports = function (RED) {
    RED.nodes.registerType("dali-command", function (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var telnetEngine;
        var nodeServer = RED.nodes.getNode(config.server);
        var statusBroadcasting = null;
        var statusVal = { fill: "grey", shape: "ring", text: "idle" };
        var statusResetter = null;
        if (nodeServer) {
            telnetEngine = nodeServer.connection;
            var statusSender = nodeServer.getStatusBroadcaster();
            statusBroadcasting = statusSender.thenAgain((st) => {
                statusVal = Object.assign(statusVal, st);
                this.status(statusVal);
            });
        }
        const setStatus = (state) => {
            clearTimeout(statusResetter);
            if (state) {
                statusVal['shape'] = "dot";
                statusResetter = setTimeout(() => { setStatus(false); }, 500);
            }
            else {
                statusVal['shape'] = "ring";
            }
            this.status(statusVal);
        };
        setStatus(false);
        this.on("input", (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            this.log("T1 => " + (telnetEngine ? true : false) + " msg: " + msg.payload.toString());
            if (telnetEngine) {
                this.log("T2 => " + (telnetEngine ? true : false) + " msg: " + msg.payload.toString());
                setStatus(true);
                telnetEngine.engine.requestString(msg.payload.toString() + "\n\r", telnetEngingLib.untilMilli(100))
                    .then((s) => { console.log("3=== found the prompt: " + s); })
                    .catch(() => { console.log("4=== couldn't find the prompt"); })
                    .finally(() => {
                    console.log("5=== finished");
                    telnetEngine.engine.terminate();
                });
                telnetEngine.engine.terminate();
            }
            // this.status({
            //     fill:"green",
            //     shape:"dot",
            //     text: "{address:"
            //         + msg.payload.address
            //         + ", value:" + msg.payload.value 
            //         + (typeof msg.payload.secondPaylod == "undefined" 
            //             ? "" 
            //             : ", {0x" 
            //                 + msg.payload.secondPaylod[0].toString(16)
            //                 + ", 0x" 
            //                 + msg.payload.secondPaylod[1].toString(16)
            //                 + "}" 
            //             )
            //         + "}"
            // });
            send(msg);
            done();
        }));
        this.on("close", () => __awaiter(this, void 0, void 0, function* () {
            if (statusBroadcasting) {
                statusBroadcasting.resolve();
            }
        }));
    });
};
//# sourceMappingURL=resi-dali-ascii-gateway.js.map