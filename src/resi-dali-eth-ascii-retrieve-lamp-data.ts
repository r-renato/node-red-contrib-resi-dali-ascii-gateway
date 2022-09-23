import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface, DALICMD, RESICMD } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, invalidPayloadIn, executeDALICommand, buildRequestNodeMessage, buildErrorNodeMessage, testBusAvailability } from './shared-functions' ;
import { doesNotMatch } from "assert";

const daliLampLevelNodeName:string = "dali-retrieve-lamp-data" ;

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
            
            return( isValid ) ;
        }

        //node.log( "isSystemConsole: " + nodeServer.connection.isSystemConsole() ) ;
        if( nodeServer ) {
            status = new Status( node, nodeServer ) ;
            resiClient = nodeServer.connection ;

            status.setStatus( false ) ;
        }

        const retrieveDaliData = function( msg : any ) : Promise<RESIResponseInterface> {
            return new Promise( ( resolve, reject ) => {
                Promise.allSettled([
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_STATUS.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_STATUS.name ) ),
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_ACTUAL_LEVEL.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_ACTUAL_LEVEL.name ) ),
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_DEVICE_TYPE.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_DEVICE_TYPE.name ) ),
                    
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_PHYSICAL_MINIMUM.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_PHYSICAL_MINIMUM.name ) ),
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_MIN_LEVEL.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_MIN_LEVEL.name ) ),
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_MAX_LEVEL.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_MAX_LEVEL.name ) ),
                    
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_POWER_ON_LEVEL.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_POWER_ON_LEVEL.name ) ),
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_SYSTEM_FAILURE_LEVEL.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_SYSTEM_FAILURE_LEVEL.name ) ),

                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_FADE_TIME_FADE_RATE.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_FADE_TIME_FADE_RATE.name ) ),      
                        
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_GROUPS_0_7.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_GROUPS_0_7.name ) ),      
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_GROUPS_8_15.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_GROUPS_8_15.name ) ),  
                    executeDALICommand( nodeServer, RESICMD.LAMP_QUERY_RGBWAF.name + msg.payload.lamp + ',6', 
                        buildRequestNodeMessage( msg, RESICMD.LAMP_QUERY_RGBWAF.name, '' ) ),  
                ]).then( ( responses : any[] ) => {
                    var result = <RESIResponseInterface> Object.assign({}, msg) ;
                     result = objectRename( result, 'payload', 'daliRequest' ) ;
                    let payload : any = {
                        status : responses[ 0 ].value.payload,
                        actualLampLevel : responses[ 1 ].value.payload.actualLampLevel,
                        deviceType : responses[ 2 ].value.payload,
                        physicalMinimumLevel : responses[ 3 ].value.payload.physicalMinimumLevel,
                        minLevel : responses[ 4 ].value.payload.minLevel,
                        maxLevel : responses[ 5 ].value.payload.maxLevel,
                        
                        powerOnLevel : responses[ 6 ].value.payload.powerOnLevel,
                        systemFailureLevel : responses[ 7 ].value.payload.systemFailureLevel,
                        fadeTimeFadeRate : responses[ 8 ].value.payload.fadeTimeFadeRate,
                        groups : { ...responses[ 9 ].value.payload.groups, ...responses[ 10 ].value.payload.groups },
                    } ;
                    
                    if( typeof responses[ 11 ].value.payload.timeout === 'undefined' ) {
                        payload.arcPowerLevel = responses[ 11 ].value.payload.arcPowerLevel ;
                        payload.color = responses[ 11 ].value.payload.color ;
                    }

                    delete payload.status[ 'done' ] ; delete payload.status[ 'raw' ] ;
                    delete payload.deviceType[ 'done' ] ; delete payload.deviceType[ 'raw' ] ;

                    result.payload = payload ;

                    if( nodeServer.connection.isSystemConsole() ) console.log( "responses: " + JSON.stringify( responses ) ) ;
                    resolve( result ) ;
                }).catch( ( error ) => {
                    if( nodeServer.connection.isSystemConsole() ) console.log( error ) ;
                    reject( buildErrorNodeMessage( msg, 'Error occurred' ) ) ;
                });   
            }) ;
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

            if( isValidDALIMsg( msg ) ) {
                var queryStatusCmd = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0x90' ;
                var queryActualLevel = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0xA0' ;
                var queryActualLevel = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0x99' ;

                testBusAvailability( nodeServer, msg )
                .then( () => {
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_CONTROL_GEAR_PRESENT.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_CONTROL_GEAR_PRESENT.name ) )
                    .then( ( response : any ) => {
                        //console.log( "response: " + JSON.stringify( response ) ) ;
                        if( response.payload.done && typeof response.payload.timeout == 'undefined' ) {
                            retrieveDaliData( msg ).then( ( result ) => {
                                send( result ) ;
                                done() ;
                            }).catch( ( error ) => {
                                send( error ) ;
                                done() ;
                            }) ;
                            
                        } else {
                            // Timeout
                            send(<nodered.NodeMessage> response) ;
                            done() ;
                        }
                    }).catch( () => {
                        send( buildErrorNodeMessage( msg, 'Error occurred' ) ) ;
                        done() ;
                    }) ;
                }).catch( () => {
                    send( buildErrorNodeMessage( msg, 'Error occurred' ) ) ;
                    done() ;
                }) ;
 
            } else {
                send( buildErrorNodeMessage( msg, 'Invalid dali message' ) ) ;
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