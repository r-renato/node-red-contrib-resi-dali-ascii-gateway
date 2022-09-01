import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface, DALICMD, RESICMD  } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, invalidPayloadIn, executeDALICommand, buildRequestNodeMessage, buildErrorNodeMessage, isRESIValidResponse, executeRESICommand } from './shared-functions' ;

const daliLampLevelNodeName:string = "dali-setup-lamp-brightness" ;
const validDALICmd : string[] = [
    <string>DALICMD.STORE_THE_DTR_AS_MIN_LEVEL.name,
    <string>DALICMD.STORE_THE_DTR_AS_MAX_LEVEL.name,
    <string>DALICMD.STORE_DTR_AS_POWER_ON_LEVEL.name,
    <string>DALICMD.STORE_DTR_AS_SYSTEM_FAILURE_LEVEL.name,
    <string>DALICMD.STORE_DTR_AS_FADERATE.name,
    <string>DALICMD.STORE_DTR_AS_FADETIME.name
] ;

module.exports = function (RED: nodered.NodeAPI) {

    RED.nodes.registerType( daliLampLevelNodeName,
    function (this: nodered.Node, config: any): void {
        RED.nodes.createNode(this, config);
        var node: nodered.Node = this;

        var nodeServer = <NodeExtendedInterface> RED.nodes.getNode( config.server ) ;
        var resiClient: NodeRESIClientInterface ;
        var status: StatusInterface ;

        const invalidMessageIn = function( msg : any ) : any {
            let isValid : boolean = true ;
            let message : any = null ;
      
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'lamp' )) ) { 
                message = '\'lamp\' attribute Not Found' ;
                isValid = false ;
            }
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'daliCommand' )) ) { 
                message = '\'daliCommand\' attribute Not Found' ;
                isValid = false ;
            }
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'level' )) ) { 
                message = '\'level\' attribute Not Found' ;
                isValid = false ;
            }

            if( message ) node.error( message, msg ) ;
            return( message ) ;
        }

        const rollback = function( lamp : number, level : number, msg : any ) {
            return executeRESICommand( nodeServer, RESICMD.LAMP_LEVEL.name + lamp + '=' + level, 
                buildRequestNodeMessage( msg, RESICMD.LAMP_LEVEL.name, '' ) )
        }

        /**
         * 
         */
        this.on("input", async (msg: any, send, done) => {
            if( invalidPayloadIn(msg) || !nodeServer) {
                node.error( 'payload Not Found', msg ) ;
                
                send( buildErrorNodeMessage( msg, 'payload Not Found' ) ) ;
                done() ;
                return ;
            }
            
            let isInvalidMessageIn = invalidMessageIn( msg ) ;

            if( ! isInvalidMessageIn ) {
                if( validDALICmd.indexOf( msg.payload.command ) > -1 ) {
                    // OK Command is valid
                    executeRESICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_ACTUAL_LEVEL.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_ACTUAL_LEVEL.name ) )
                    .then( ( lampLevelResponse : any) => {
                        executeRESICommand( nodeServer, RESICMD.LAMP_LEVEL.name
                            + msg.payload.lamp + '=' 
                            + msg.payload.level, 
                            buildRequestNodeMessage( msg, RESICMD.LAMP_LEVEL.name, '' ))
                        .then( ( setLampLevelResponse : any ) => {
                            executeRESICommand( nodeServer, RESICMD.COMMAND.name
                                + msg.payload.lamp + '=' 
                                + DALICMD.STORE_ACTUAL_LEVEL_IN_DTR.opcode, 
                                buildRequestNodeMessage( msg, RESICMD.COMMAND.name, DALICMD.STORE_ACTUAL_LEVEL_IN_DTR.name ))
                            .then( () => {
                                executeRESICommand( nodeServer, RESICMD.COMMAND.name
                                    + msg.payload.lamp + '=' 
                                    + DALICMD[ msg.payload.command.replace(/ /g,"_") ].opcode, 
                                    buildRequestNodeMessage( msg, RESICMD.COMMAND.name, DALICMD.STORE_ACTUAL_LEVEL_IN_DTR.name ))
                                .then( () => {
                                    send( msg ) ;
                                    done() ;
                                }).catch( () => {
                                    // Roll back
                                    rollback( msg.payload.lamp, lampLevelResponse.payload.actualLampLevel, msg )
                                    .then( () => {

                                    }).catch( () => {}) ;
                                }) ;
                            })
                            .catch( () => {
                                // Rollback
                            }) ;
                        }).catch( () => {
                            // Rollback
                        }) ;

                    }).catch( ( message ) => {
                        send( message ) ; done() ;
                    }) ;
                } else {
                    node.error( 'Invalid command', msg ) ;
                    send( buildErrorNodeMessage( msg, 'Invalid command' ) ) ;
                }
            } else {
                send( buildErrorNodeMessage( msg, isInvalidMessageIn ) ) ;
                done() ;
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