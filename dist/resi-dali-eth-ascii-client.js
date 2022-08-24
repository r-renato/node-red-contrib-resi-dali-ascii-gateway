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
            result = new shared_classes_1.NodeRESIClient(config.address, config.port ? config.port : 502, node, config.systemConsole);
            this.connectionMap[name] = result;
        }
        return (result);
    }
}
module.exports = function (RED) {
    //console.log( ">>>" + RED._("dali-contrib.label.logEnabled"));
    RED.nodes.registerType("resi-dali-eth-ascii-client", function (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.connection = RESIConnectionPool.getInstance().getConnection(config.name, node, config);
        // const host = config.address ;
        // const port = config.port ? config.port : 502 ;
        // node.engine = new telnetEngineLib.Engine(host, port) ;
        // var statusBroadcaster = new openpromiseLib.Cycle() ;
        // node.engine.timeOut = config.timeOut ? config.timeOut : 1000 ;
        // node.engine.clearOut = config.clearOut ? config.clearOut : 0 ;
        // node.engine.inDelimiter = config.inDelimiter ? RegExp(config.inDelimiter) : /\r\n|\r|\n/ ;
        // node.engine.outDelimiter = config.outDelimiter ? config.outDelimiter.replace(/\\n/, '\n').replace(/\\r/, '\r').replace(/\\l/, '\l') : "\n" ;
        // node.engine.modeStrict = false ;
        // node.engine.autoFlush = 100 ;
        // node.engine.autoFlush = config.openTries ? config.openTries : 1 ;
        // statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", shape: "ring", text: "idle" } ) ;
        // const onConnecting = node.engine.onConnecting(() => {
        //     statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "yellow", text: "connecting" } ) ;
        // })
        // const onSuccess = node.engine.onConnectionSuccess(() => {
        //     statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "OK" } ) ;
        //     node.log( "Connected to " + host + ":" + port ) ;
        // })
        // const onError = node.engine.onConnectionError(() => {
        //     node.error( 'Connection error during communication' ) ;
        //     statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "error" } ) ;
        // })
        // const onEnd = node.engine.onConnectionEnd(() => {
        //     statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", text: "closed" } ) ;
        //     node.log( 'Requested an end to the  connection' ) ;
        // })
        // const onConnectionTimeOut = node.engine.onConnectionTimeOut(() => {
        //     statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "timeout" } ) ;
        //     node.error( 'Connection wait exceeded timeout' ) ;
        // })
        // const onResponseTimeOut = node.engine.onResponseTimeOut(() => {
        //     statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "timeout" } ) ;
        //     node.error( 'Response wait exceeded timeout value (request ${node.engine.timeOut})' ) ;
        // })
        // const onReceive = node.engine.onReceive(() => {
        //     statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "OK" } ) ;
        // })
        node.getStatusBroadcaster = () => { return node.connection.getNodeStatusBroadcaster(); };
        this.on("input", (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            done();
        }));
        this.on("close", (msg) => __awaiter(this, void 0, void 0, function* () {
            // Nothing to do
        }));
    });
};
//# sourceMappingURL=resi-dali-eth-ascii-client.js.map