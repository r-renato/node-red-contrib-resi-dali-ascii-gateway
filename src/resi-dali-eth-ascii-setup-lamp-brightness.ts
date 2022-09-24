import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface, DALICMD, RESICMD  } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, invalidPayloadIn, executeDALICommand, buildRequestNodeMessage, buildErrorNodeMessage, isRESIValidResponse, executeRESICommand, testBusAvailability, toHexString } from './shared-functions' ;

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
            } else 
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'command' )) ) { 
                message = '\'daliCommand\' attribute Not Found' ;
                isValid = false ;
            } else 
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'level' )) ) { 
                message = '\'level\' attribute Not Found' ;
                isValid = false ;
            }

            if( message ) node.error( message + " " + JSON.stringify( msg.payload ), msg ) ;
            return( message ) ;
        }

        const rollback = function( lamp : number, level : number, msg : any ) {
            if( level == 0) {
                return executeRESICommand( nodeServer, RESICMD.LAMP_OFF.name + lamp, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP_LEVEL.name, '' ) )
            } else {
                return executeRESICommand( nodeServer, RESICMD.LAMP_LEVEL.name + lamp + '=' + level, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP_LEVEL.name, '' ) )
            }
        }

        // const retrieveDaliData = function( msg : any ) : Promise<RESIResponseInterface> {
        //     return new Promise( ( resolve, reject ) => {
        //             // OK Command is valid
        //             executeRESICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_ACTUAL_LEVEL.opcode, 
        //                 buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_ACTUAL_LEVEL.name ) )
        //             .then( ( lampLevelResponse : any) => {
        //                 executeRESICommand( nodeServer, RESICMD.LAMP_LEVEL.name
        //                     + msg.payload.lamp + '=' 
        //                     + msg.payload.level, 
        //                     buildRequestNodeMessage( msg, RESICMD.LAMP_LEVEL.name, '' ))
        //                 .then( ( setLampLevelResponse : any ) => {
        //                     executeRESICommand( nodeServer, RESICMD.LAMP_COMMAND.name
        //                         + msg.payload.lamp + '=' 
        //                         + DALICMD.STORE_ACTUAL_LEVEL_IN_DTR.opcode, 
        //                         buildRequestNodeMessage( msg, RESICMD.LAMP_COMMAND.name, DALICMD.STORE_ACTUAL_LEVEL_IN_DTR.name ))
        //                     .then( () => {
        //                         executeRESICommand( nodeServer, RESICMD.LAMP_COMMAND.name
        //                             + msg.payload.lamp + '=' 
        //                             + DALICMD[ msg.payload.command.replace(/ /g,"_") ].opcode, 
        //                             buildRequestNodeMessage( msg, RESICMD.LAMP_COMMAND.name, DALICMD[ msg.payload.command.replace(/ /g,"_") ].name ))
        //                         .then( ( response ) => {
        //                             var result = Object.assign({}, msg) ;
        //                             result = objectRename( result, 'payload', 'daliRequest' ) ;
        //                             result.payload = response.payload ;
        //                             rollback( msg.payload.lamp, lampLevelResponse.payload.actualLampLevel, msg )
        //                             .then( () => {
        //                                 send( result ) ;
        //                                 done() ;
        //                             }).catch( () => {
        //                                 send( result ) ;
        //                                 done() ;
        //                             });
        //                         }).catch( ( e ) => {
        //                             // Roll back
        //                             node.error( "rollback1 " + e, msg ) ;
        //                             rollback( msg.payload.lamp, lampLevelResponse.payload.actualLampLevel, msg )
        //                             .then( () => {
        //                                 send( buildErrorNodeMessage( msg, e ) ) ;
        //                                 done()
        //                             }).catch( (e) => {
                                        
        //                             }) ;
        //                         }) ;
        //                     })
        //                     .catch( (e) => {
        //                         // Rollback
        //                         node.error( "rollback2 " + e, msg ) ;
        //                     }) ;
        //                 }).catch( (e) => {
        //                     // Rollback
        //                     node.error( "rollback3 " + e, msg ) ;
        //                 }) ;

        //             }).catch( ( message ) => {
        //                 send( message ) ; done() ;
        //             }) ;
        //     });
        // } ;

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
                    if( nodeServer.connection.isSystemConsole() ) nodeServer.log( 
                        'LAMP ' + msg.payload.lamp
                        + ' value ' + msg.payload.level
                        + ' command ' + msg.payload.command.split(' ').join('_')
                    ) ;
                    testBusAvailability( nodeServer, msg )
                    .then( () => {
                        // Load value in DTR
                        executeDALICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR.opcode + toHexString( msg.payload.level ) , 
                            buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR.name ) )
                        .then( ( response : any ) => {
                            // Store data
                            let cmd = msg.payload.command.split(' ').join('_') ;
                            let storeCmd = RESICMD.LAMP_COMMAND_REPEAT.name + msg.payload.lamp + "=" + DALICMD[ cmd ].opcode
                            executeDALICommand( nodeServer, storeCmd, 
                                buildRequestNodeMessage( msg, RESICMD.LAMP_COMMAND_REPEAT.name, DALICMD[ cmd ].name ) )
                            .then( ( response : any ) => {
                                if( response.payload.done && typeof response.payload.timeout == 'undefined' ) {
                                    send( response ) ;
                                    done() ;
                                } else {
                                    // Timeout
                                    send(<nodered.NodeMessage> response) ;
                                    done() ;
                                }
                            }).catch( () => {
                                send( buildErrorNodeMessage( msg, 'Error occurred : Executing ' + DALICMD[ cmd ].name) ) ;
                                done() ;
                            }) ;
                        }).catch( ( error ) => {
                            console.log( error ) ;
                            send( buildErrorNodeMessage( msg, 'Error occurred : Setting DTR.' ) ) ;
                            done() ;
                        }) ;
                    }).catch( () => {
                        send( buildErrorNodeMessage( msg, 'Error occurred :  DALI Bus unavailable.' ) ) ;
                        done() ;
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