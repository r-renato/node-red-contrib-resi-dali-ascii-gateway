import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, invalidPayloadIn, prepareDALIResponse } from './shared-functions' ;
import { doesNotMatch } from "assert";

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

        const isValidDALIMsg = function( msg : any ) : boolean {
            let isValid = true
      
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'command' )) ) { 
                node.error( 'command Not Found', msg ) ;
                isValid = false ;
            }
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'action' )) ) { 
                node.error( 'action Not Found', msg ) ;
                isValid = false ;
            }           
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'params' )) ) { 
                node.error( 'params Not Found', msg ) ;
                isValid = false ;
            }  
            
            return( isValid ) ;
        }

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
                node.error( 'payload Not Found', msg ) ;
                //TODO
                // Va restituito un errore
                done() ;
                return ;
            }

            if( isValidDALIMsg( msg ) ) {
                //status.setStatus( true ) ;
                var textCommand: string = "#" 
                    + msg.payload.command.replace(/^\s+|\s+$/g, '')
                    + " "
                    + msg.payload.action.replace(/^\s+|\s+$/g, '')
                    + ((<string> msg.payload.params.replace(/^\s+|\s+$/g, '')).length > 0 
                        ? msg.payload.params.replace(/^\s+|\s+$/g, '') : '')                    
                    ;

                if( resiClient.isSystemConsole() ) node.log( "Try to sending command: " + textCommand ) ;

                nodeServer.connection.send( textCommand ).then( ( response ) => {
                    var result = <RESIResponseInterface> Object.assign({}, msg)
                    result = objectRename( result, 'payload', 'daliRequest' ) ;
                    result.payload = prepareDALIResponse( msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ) ;
                    result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
                    //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
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
            }
        });

        /**
         * 
         */
        this.on( "close", async (done:any) => {
            if( nodeServer ) {
                if( resiClient.isSystemConsole() ) {
                    node.log( "close" ) ;
                }
                if( resiClient ) {
                    if ( status.getStatusBroadcasting() ) { status.getStatusBroadcasting().resolve(); }
                }
            }
            done() ;
        });
    });
    
} 