import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface, DALICMD, RESICMD  } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, invalidPayloadIn, executeDALICommand, buildRequestNodeMessage, buildErrorNodeMessage } from './shared-functions' ;

const daliLampLevelNodeName:string = "dali-lamp-color" ;

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
      
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'lamp' )) ) { 
                node.error( 'lamp attribute Not Found', msg ) ;
                isValid = false ;
            }
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'color' )) ) { 
                node.error( 'color attribute Not Found', msg ) ;
                isValid = false ;
            }

            return( isValid ) ;
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
                executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_ACTUAL_LEVEL.opcode, 
                    buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_ACTUAL_LEVEL.name ) )
                .then( ( lampLevelResponse ) => {
                    console.log( "lampLevelResponse: " + JSON.stringify( lampLevelResponse ) ) ;
                    if( typeof (<any> lampLevelResponse).payload.timeout === 'undefined' ) {
                        if( (<any> lampLevelResponse).payload.actualLampLevel == 0 ) {
                            executeDALICommand( nodeServer, RESICMD.LAMP_RGBWAF.name
                                + msg.payload.lamp + ',' 
                                + (<any> lampLevelResponse).payload.actualLampLevel + ',' 
                                + msg.payload.color, 
                                buildRequestNodeMessage( msg, RESICMD.LAMP_RGBWAF.name, '' ) )
                            .then( ( response ) => {
                                console.log( "response: " + JSON.stringify( response ) ) ;

                                var result = Object.assign({}, msg) ;
                                result = objectRename( msg, 'payload', 'daliRequest' ) ;
                                result.payload = response.payload ;

                                send( <nodered.NodeMessage> result ) ;
                                done() ;
                            }).catch( ( error ) => {
                        // Error timeout
                                var result = Object.assign({}, msg) ;
                                result = objectRename( msg, 'payload', 'daliRequest' ) ;
                                result.payload = (<any> lampLevelResponse).payload ;
                                send( buildErrorNodeMessage( result, ' ' ) ) ;
                            }) ;  
                        } else {
                            var result = Object.assign({}, msg) ;
                            result = objectRename( msg, 'payload', 'daliRequest' ) ;
                            result.payload = (<any> lampLevelResponse).payload ;
                            send( buildErrorNodeMessage( msg, 'Actual Lamp Level is zero (0)' ) ) ;
                            done() ;
                        }            
                    } else {
                        // Error timeout
                        var result = Object.assign({}, msg) ;
                        result = objectRename( msg, 'payload', 'daliRequest' ) ;
                        result.payload = (<any> lampLevelResponse).payload ;
                        send( buildErrorNodeMessage( result, ' ' ) ) ;
                    }
                }).catch( ( error ) => {
                    if( nodeServer && resiClient ) {
                        if( resiClient.isSystemConsole() ) console.log( error ) ;
                    }
                    send( buildErrorNodeMessage( msg, '', error ) ) ;
                }) ;
            }
        });

        /**
         * 
         */
        this.on( "close", async (done:any) => {
            if( nodeServer && resiClient ) {
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