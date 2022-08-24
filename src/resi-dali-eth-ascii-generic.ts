import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, invalidPayloadIn } from './shared-functions' ;

const daliLampLevelNodeName:string = "dali-generic" ;

//const telnetEngingLib = require( "telnet-engine" ) ;

module.exports = function (RED: nodered.NodeAPI) {

    RED.nodes.registerType( daliLampLevelNodeName,
    function (this: nodered.Node, config: any): void {
        RED.nodes.createNode(this, config);
        var node: nodered.Node = this;

        var nodeServer = <NodeExtendedInterface> RED.nodes.getNode( config.server ) ;
        var resiClient: NodeRESIClientInterface ;
        var status: StatusInterface ;

        node.log( "isSystemConsole: " + nodeServer.connection.isSystemConsole() ) ;
        if( nodeServer ) {
            status = new Status( node, nodeServer ) ;
            resiClient = nodeServer.connection ;

            status.setStatus( false ) ;
        }

        /**
         * 
         */
        this.on("input", async (msg: any, send, done) => {
            if( invalidPayloadIn(msg) || !nodeServer) {
                return
            }

            status.setStatus( true ) ;
            var textCommand: string = msg.payload.command ;

            if( resiClient.isSystemConsole() ) node.log( "Try to sending command: " + textCommand ) ;

            nodeServer.connection.send( textCommand ).then( ( response ) => {
                var result = <RESIResponseInterface> Object.assign({}, msg)
                result = objectRename( result, 'payload', 'daliRequest' ) ;
                result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
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

            done() ;
        });

        /**
         * 
         */
        this.on( "close", async () => {
            if( nodeServer ) {
                if( resiClient.isSystemConsole() ) {
                    node.log( "close" ) ;
                }
                if( resiClient ) {
                    if ( status.getStatusBroadcasting() ) { status.getStatusBroadcasting().resolve(); }
                }
            }
        });

    });
    
} 