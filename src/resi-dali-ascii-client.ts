import * as nodered from "node-red" ;

interface NodeE extends nodered.Node {
    engine: any,
    getStatusBroadcaster : any
}

module.exports = function (RED: nodered.NodeAPI) {
    const telnetEngineLib = require( 'telnet-engine' ) ;
    const openpromiseLib = require( 'openpromise' ) ;

    RED.nodes.registerType( "resi-dali-ascii-client",
    function (this: nodered.Node, config: any): void {
        RED.nodes.createNode(this, config) ;

        var node = <NodeE> this ;

        const host = config.address ;
        const port = config.port ? config.port : 502 ;

        node.engine = new telnetEngineLib.Engine(host, port) ;
        var statusBroadcaster = new openpromiseLib.Cycle() ;

        node.engine.timeOut = config.timeOut ? config.timeOut : 1000 ;
        node.engine.clearOut = config.clearOut ? config.clearOut : 0 ;
        node.engine.inDelimiter = config.inDelimiter ? RegExp(config.inDelimiter) : /\r\n|\r|\n/ ;
        node.engine.outDelimiter = config.outDelimiter ? config.outDelimiter.replace(/\\n/, '\n').replace(/\\r/, '\r').replace(/\\l/, '\l') : "\n" ;
        node.engine.modeStrict = false ;
        node.engine.autoFlush = 100 ;
        node.engine.autoFlush = config.openTries ? config.openTries : 1 ;

        statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", shape: "ring", text: "idle" } ) ;

        const onConnecting = node.engine.onConnecting(() => {
            statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "yellow", text: "connecting" } ) ;
        })

        const onSuccess = node.engine.onConnectionSuccess(() => {
            statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "OK" } ) ;
            node.log( "Connected to " + host + ":" + port ) ;
        })

        const onError = node.engine.onConnectionError(() => {
            node.error( 'Connection error during communication' ) ;
            statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "error" } ) ;
        })

        const onEnd = node.engine.onConnectionEnd(() => {
            statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", text: "closed" } ) ;
            node.log( 'Requested an end to the  connection' ) ;
        })

        const onConnectionTimeOut = node.engine.onConnectionTimeOut(() => {
            statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "timeout" } ) ;
            node.error( 'Connection wait exceeded timeout' ) ;
        })

        const onResponseTimeOut = node.engine.onResponseTimeOut(() => {
            statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "timeout" } ) ;
            node.error( 'Response wait exceeded timeout value (request ${node.engine.timeOut})' ) ;
        })

        const onReceive = node.engine.onReceive(() => {
            statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "OK" } ) ;
        })

        node.getStatusBroadcaster = () => { return statusBroadcaster } ;

        this.on("input", async (msg: any, send, done) => {
            done();
        }) ;
        
        this.on("close", async (msg: any) => {
            () => {
                node.engine.destroy() ;
                statusBroadcaster.terminate() ;
            }
        }) ;
    }) ;
}
