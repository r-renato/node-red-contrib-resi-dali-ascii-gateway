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
class RESIConnectionPool {
    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    constructor() {
        this.connectionMap = {};
    }
    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    static getInstance() {
        if (!RESIConnectionPool.instance) {
            RESIConnectionPool.instance = new RESIConnectionPool();
        }
        return RESIConnectionPool.instance;
    }
    getConnection(name, node, config) {
        let result = this.connectionMap[name];
        if (typeof config !== 'undefined' && typeof node !== 'undefined' && typeof result === 'undefined') {
            if (config.systemConsole)
                console.log("systemConsole: " + config.systemConsole);
            result = new shared_classes_1.RESIClient(config.address, config.port ? config.port : 502, config.operationsTimeout ? config.operationsTimeout : 60000, config.lockWaitTimeout ? config.lockWaitTimeout : 200, config.systemConsole, config.logEnabled);
            if (config.systemConsole)
                console.log("RESIConnectionPool:getConnection => RESIClient created.");
            this.connectionMap[name] = result;
            if (config.systemConsole)
                console.log("RESIConnectionPool:getConnection => RESIClient cached.");
        }
        return (new shared_classes_1.NodeRESIClient(result));
    }
}
module.exports = function (RED) {
    //console.log( ">>>" + RED._("dali-contrib.label.logEnabled"));
    RED.nodes.registerType("resi-dali-eth-ascii-client", function (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.log('dali-client [input] 1');
        node.connection = RESIConnectionPool.getInstance().getConnection(config.name, node, config);
        node.log('dali-client [input] 2');
        node.getStatusBroadcaster = () => { return node.connection.getNodeStatusBroadcaster(); };
        node.log('dali-client [input] 3');
        this.on("input", (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            node.log('dali-client [input]');
            done();
        }));
        this.on("close", (done) => __awaiter(this, void 0, void 0, function* () {
            // Nothing to do
            done();
        }));
    });
};
//# sourceMappingURL=resi-dali-eth-ascii-client.js.map