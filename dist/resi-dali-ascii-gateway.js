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
class TelnetEnginePool {
    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    constructor() {
        this.engines = {};
    }
    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    static getInstance() {
        if (!TelnetEnginePool.instance) {
            TelnetEnginePool.instance = new TelnetEnginePool();
        }
        return TelnetEnginePool.instance;
    }
    getEngine() {
        // ...
    }
}
var telnetEngine = TelnetEnginePool.getInstance;
module.exports = function (RED) {
    RED.nodes.registerType("dali-command", function (config) {
        RED.nodes.createNode(this, config);
        this.on("input", (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            this.status({
                fill: "green",
                shape: "dot",
                text: "{address:"
                    + msg.payload.address
                    + ", value:" + msg.payload.value
                    + (typeof msg.payload.secondPaylod == "undefined"
                        ? ""
                        : ", {0x"
                            + msg.payload.secondPaylod[0].toString(16)
                            + ", 0x"
                            + msg.payload.secondPaylod[1].toString(16)
                            + "}")
                    + "}"
            });
            send(msg);
            done();
        }));
    });
};
//# sourceMappingURL=resi-dali-ascii-gateway.js.map