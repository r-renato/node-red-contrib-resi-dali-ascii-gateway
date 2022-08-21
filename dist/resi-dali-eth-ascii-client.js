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
const telnetEngineLib = require('telnet-engine');
const openpromiseLib = require('openpromise');
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
    getEngine(name, node, config) {
        let result = this.engines[name];
        if (typeof config !== 'undefined' && typeof node !== 'undefined' && typeof result === 'undefined') {
            result = {};
            const host = config.address;
            const port = config.port ? config.port : 502;
            result.engine = new telnetEngineLib.Engine(host, port);
            result.engine.timeOut = config.timeOut ? config.timeOut : 1500;
            result.engine.outDelimiter = "\r";
            result.engine.modeStrict = false;
            result.proxy = result.engine.proxy();
            // result.engine.clearOut = config.clearOut ? config.clearOut : 0 ;
            // result.engine.inDelimiter = config.inDelimiter ? RegExp(config.inDelimiter) : /\r\n|\r|\n/ ;
            // result.engine.outDelimiter = config.outDelimiter ? config.outDelimiter.replace(/\\n/, '\n').replace(/\\r/, '\r').replace(/\\l/, '\l') : "\n" ;
            // result.engine.modeStrict = false ;
            // result.engine.autoFlush = 100 ;
            // result.engine.autoFlush = config.openTries ? config.openTries : 1 ;
            result.statusBroadcaster = new openpromiseLib.Cycle();
            const onConnecting = result.engine.onConnecting(() => {
                result.statusBroadcaster.repeat({ fill: "yellow", text: "connecting" });
            });
            const onSuccess = result.engine.onConnectionSuccess(() => {
                result.statusBroadcaster.repeat({ fill: "green", text: "OK" });
                node.log("Connected to " + host + ":" + port);
            });
            const onError = result.engine.onConnectionError(() => {
                node.error('Connection error during communication');
                result.statusBroadcaster.repeat({ fill: "red", text: "error" });
            });
            const onEnd = result.engine.onConnectionEnd(() => {
                result.statusBroadcaster.repeat({ fill: "grey", text: "closed" });
                node.log('Requested an end to the  connection');
            });
            const onConnectionTimeOut = result.engine.onConnectionTimeOut(() => {
                result.statusBroadcaster.repeat({ fill: "red", text: "timeout" });
                node.error('Connection wait exceeded timeout');
            });
            const onResponseTimeOut = result.engine.onResponseTimeOut(() => {
                result.statusBroadcaster.repeat({ fill: "red", text: "timeout" });
                node.error('Response wait exceeded timeout value (request ${node.engine.timeOut}) ' + result.engine.timeOut);
            });
            const onReceive = result.engine.onReceive(() => {
                result.statusBroadcaster.repeat({ fill: "green", text: "OK" });
            });
            node.log("RESI-DALI-ETH - create new connection: " + name);
        }
        else {
            console.log("RESI-DALI-ETH - reuse connection: " + name);
        }
        return (result);
    }
}
module.exports = function (RED) {
    RED.nodes.registerType("resi-dali-eth-ascii-client", function (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.connection = TelnetEnginePool.getInstance().getEngine(config.name, node, config);
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
        node.getStatusBroadcaster = () => { return node.connection.statusBroadcaster; };
        this.on("input", (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
            done();
        }));
        this.on("close", (msg) => __awaiter(this, void 0, void 0, function* () {
            () => {
                node.connection.destroy();
                node.connection.statusBroadcaster.terminate();
            };
        }));
    });
};
//# sourceMappingURL=resi-dali-eth-ascii-client.js.map