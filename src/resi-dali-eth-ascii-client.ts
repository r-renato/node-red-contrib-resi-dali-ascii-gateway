import * as nodered from "node-red" ;
import { NodeExtendedInterface, TelnetEngineInterface } from './shared-interfaces' ;

const telnetEngineLib = require( 'telnet-engine' ) ;
const openpromiseLib = require( 'openpromise' ) ;

class TelnetEnginePool {
    private static instance: TelnetEnginePool;
    private engines: {[key: string]: TelnetEngineInterface } = {} ;

    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() { }

    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    public static getInstance(): TelnetEnginePool {
        if (!TelnetEnginePool.instance) {
            TelnetEnginePool.instance = new TelnetEnginePool();
        }

        return TelnetEnginePool.instance;
    }

    public getEngine( name: string, node?: nodered.Node, config?: any ) : TelnetEngineInterface {
        let result: TelnetEngineInterface = this.engines[ name ] ;
        
        if( typeof config !== 'undefined' && typeof node !== 'undefined' && typeof result === 'undefined' ) {
            result = {} as TelnetEngineInterface ;

            const host = config.address ;
            const port = config.port ? config.port : 502 ;

            result.engine = new telnetEngineLib.Engine(host, port) ;
            result.engine.timeOut = config.timeOut ? config.timeOut : 1500 ;
            result.engine.openTimeout = 1500 ;
            result.engine.requestTimeout = 2000 ;
            result.engine.outDelimiter = "\r" ;
            result.engine.modeStrict = false ;

            result.systemConsole = config.systemConsole ;
            result.logEnabled = config.logEnabled ;

            result.proxy = result.engine.proxy() ;
            // result.engine.clearOut = config.clearOut ? config.clearOut : 0 ;
            // result.engine.inDelimiter = config.inDelimiter ? RegExp(config.inDelimiter) : /\r\n|\r|\n/ ;
            // result.engine.outDelimiter = config.outDelimiter ? config.outDelimiter.replace(/\\n/, '\n').replace(/\\r/, '\r').replace(/\\l/, '\l') : "\n" ;
            // result.engine.modeStrict = false ;
            // result.engine.autoFlush = 100 ;
            // result.engine.autoFlush = config.openTries ? config.openTries : 1 ;

            result.statusBroadcaster = new openpromiseLib.Cycle() ;

            const onConnecting = result.engine.onConnecting(() => {
                result.statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "yellow", text: "connecting" } ) ;
                node.log( "Connecting to " + host + ":" + port ) ;
            })
            const onSuccess = result.engine.onConnectionSuccess(() => {
                result.statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "OK" } ) ;
                node.log( "Connected to " + host + ":" + port ) ;
            })
    
            const onError = result.engine.onConnectionError(() => {
                node.error( 'Connection error during communication' ) ;
                result.statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "error" } ) ;
            })
    
            const onEnd = result.engine.onConnectionEnd(() => {
                result.statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", text: "closed" } ) ;
                node.log( 'Requested an end to the  connection' ) ;
            })
    
            const onConnectionTimeOut = result.engine.onConnectionTimeOut(() => {
                result.statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "timeout" } ) ;
                node.error( 'Connection wait exceeded timeout' ) ;
            })
    
            const onResponseTimeOut = result.engine.onResponseTimeOut(() => {
                result.statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "timeout" } ) ;
                node.error( 'Response wait exceeded timeout value (request ${node.engine.timeOut}) ' + result.engine.requestTimeout ) ;
            })
    
            const onReceive = result.engine.onReceive(() => {
                result.statusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "OK" } ) ;
            })
    
            node.log( "RESI-DALI-ETH - create new connection: " + name ) ;
        } else {
            console.log( "RESI-DALI-ETH - reuse connection: " + name ) ;
        }

        return( result ) ;
    }
}

module.exports = function (RED: nodered.NodeAPI) {
    console.log( ">>>" + RED._("dali-contrib.label.logEnabled"));

    RED.nodes.registerType( "resi-dali-eth-ascii-client",
    function (this: nodered.Node, config: any): void {
        RED.nodes.createNode(this, config) ;

        var node = <NodeExtendedInterface> this ;

        node.connection = TelnetEnginePool.getInstance().getEngine( config.name, node, config ) ;


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

        node.getStatusBroadcaster = () => { return node.connection.statusBroadcaster } ;

        this.on("input", async (msg: any, send, done) => {
            done();
        }) ;
        
        this.on("close", async (msg: any) => {
            () => {
                node.connection.destroy() ;
                node.connection.statusBroadcaster.terminate() ;
            }
        }) ;
    }) ;
}
