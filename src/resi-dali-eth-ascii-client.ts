import * as nodered from "node-red" ;
import { NodeExtendedInterface } from './shared-interfaces' ;
import { NodeRESIClientInterface, NodeRESIClient } from './shared-classes' ;

class RESIConnectionPool {
    private static instance: RESIConnectionPool;
    private connectionMap : {[key: string]: NodeRESIClientInterface } = {} ;

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
    public static getInstance(): RESIConnectionPool {
        if (!RESIConnectionPool.instance) {
            RESIConnectionPool.instance = new RESIConnectionPool();
        }

        return RESIConnectionPool.instance;
    }

    public getConnection( name: string, node?: nodered.Node, config?: any ) : NodeRESIClientInterface {
        let result: NodeRESIClientInterface = this.connectionMap[ name ] ;
        
        if( typeof config !== 'undefined' && typeof node !== 'undefined' && typeof result === 'undefined' ) {
            if( config.systemConsole ) console.log( "systemConsole: " + config.systemConsole ) ;
            result = new NodeRESIClient( config.address, config.port ? config.port : 502, node, config.systemConsole ) ;
            if( config.systemConsole ) console.log( "RESIConnectionPool:getConnection => NodeRESIClient created." ) ;
            this.connectionMap[ name ] = result ;
            if( config.systemConsole ) console.log( "RESIConnectionPool:getConnection => NodeRESIClient cached." ) ;
        }

        return( result ) ;
    }
}

module.exports = function (RED: nodered.NodeAPI) {
    //console.log( ">>>" + RED._("dali-contrib.label.logEnabled"));

    RED.nodes.registerType( "resi-dali-eth-ascii-client",
    function (this: nodered.Node, config: any): void {
        RED.nodes.createNode(this, config) ;

        var node = <NodeExtendedInterface> this ;

        node.log( 'dali-client [input] 1' ) ;
        node.connection = RESIConnectionPool.getInstance().getConnection( config.name, node, config ) ;
        node.log( 'dali-client [input] 2' ) ;

        node.getStatusBroadcaster = () => { return node.connection.getNodeStatusBroadcaster() } ;
        node.log( 'dali-client [input] 3' ) ;

        this.on("input", async (msg: any, send, done) => {
            node.log( 'dali-client [input]' ) ;
            done();
        }) ;
        
        this.on("close", async (msg: any) => {
            // Nothing to do
        }) ;
    }) ;
}
