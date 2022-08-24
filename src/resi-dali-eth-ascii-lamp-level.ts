import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, requestTimeout } from './shared-functions' ;

const daliLampLevelNodeName:string = "dali-lamp-level" ;
const daliCommand: string = "#LAMP LEVEL" 
//const telnetEngingLib = require( "telnet-engine" ) ;

module.exports = function (RED: nodered.NodeAPI) {

    RED.nodes.registerType( daliLampLevelNodeName,
    function (this: nodered.Node, config: any): void {
        RED.nodes.createNode(this, config);
        var node: nodered.Node = this;

        var nodeServer = <NodeExtendedInterface> RED.nodes.getNode( config.server ) ;
        var resiClient: NodeRESIClientInterface ;
        var status: StatusInterface ;

        if( nodeServer ) {
            status = new Status( node, nodeServer ) ;
            resiClient = nodeServer.connection ;

            status.setStatus( false ) ;
        }

        /**
         * 
         */
        this.on("input", async (msg: any, send, done) => {
            if( nodeServer ) {
                status.setStatus( true ) ;
                var textCommand: string = daliCommand + ":" 
                    + (msg.payload.lamp | config.lamp)
                    + "=" 
                    + (msg.payload.level | config.level) ;

                if( resiClient.isSystemConsole() ) node.log( "Try to sending command: " + textCommand ) ;

                nodeServer.connection.send( textCommand ).then( ( response ) => {
                    var result = <RESIResponseInterface> Object.assign({}, msg)
                    result = objectRename( result, 'payload', 'daliRequest' ) ;
                    result.payload = response[0].response ;
                    send(<nodered.NodeMessage> result) ;
                }).catch( ( error ) => {
                    var result : any = Object.assign({}, msg) ;
                    result.error = {
                        message : error,
                        source : {
                            id : nodeServer.id,
                            type : nodeServer.type,
                            name : nodeServer.name
                        }
                    } ;
                    send([result, ,])
                }) ;
            }

            done() ;
        });

        /**
         * 
         */
        this.on( "close", async () => {
            if( resiClient.isSystemConsole() ) {
                node.log( "close" ) ;
            }
            if( resiClient ) {
                if ( status.getStatusBroadcasting() ) { status.getStatusBroadcasting().resolve(); }
            }
        });

    });
    
} 