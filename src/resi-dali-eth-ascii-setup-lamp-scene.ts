import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface, DALICMD, RESICMD  } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, invalidPayloadIn, executeDALICommand, buildRequestNodeMessage, buildErrorNodeMessage, isRESIValidResponse, executeRESICommand } from './shared-functions' ;

const daliLampLevelNodeName:string = "dali-setup-lamp-scene" ;
// const validDALICmd : string[] = [
//     <string>DALICMD.STORE_THE_DTR_AS_MIN_LEVEL.name,
//     <string>DALICMD.STORE_THE_DTR_AS_MAX_LEVEL.name,
//     <string>DALICMD.STORE_DTR_AS_POWER_ON_LEVEL.name,
//     <string>DALICMD.STORE_DTR_AS_SYSTEM_FAILURE_LEVEL.name,
//     <string>DALICMD.STORE_DTR_AS_FADERATE.name,
//     <string>DALICMD.STORE_DTR_AS_FADETIME.name
// ] ;

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
      
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'deviceType' )) ) { 
                message = '\'deviceType\' attribute Not Found' ;
                isValid = false ;
            } 
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'scene' )) ) { 
                message = '\'scene\' attribute Not Found' ;
                isValid = false ;
            } 

            // if( isValid ) {
            //     switch(  msg.payload.deviceType ) {
            //         case 8:
            //             if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'command' )) ) { 
            //                 message = '\'daliCommand\' attribute Not Found' ;
            //                 isValid = false ;
            //             } else 
            //             if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'level' )) ) { 
            //                 message = '\'level\' attribute Not Found' ;
            //                 isValid = false ;
            //             }
            //             break ;
            //     }
            // }
            
            if( message ) node.error( message + " " + JSON.stringify( msg.payload ), msg ) ;
            return( message ) ;
        }

        const setXYCoordinate = function( msg : any, deviceType : number, value : number, xy_dalicmd : any ) : any { 
            return new Promise<any>( (resolve, reject) => {
                Promise.allSettled([
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR.opcode + "0".toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR1.opcode + value.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR1.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.ENABLE_DEVICE_TYPE.opcode + deviceType.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.ENABLE_DEVICE_TYPE.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + xy_dalicmd.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, xy_dalicmd.name ) )    
                ]).then( ( responses : any[] ) => {
                    //console.log( 'setXYCoordinate: ' + JSON.stringify( responses ) ) ;
                    let payloadDTR = responses[ 0 ].value.payload ;
                    let payloadDTR1 = responses[ 1 ].value.payload ;
                    let payloadEnableDT = responses[ 2 ].value.payload ;
                    let payloadTmpStore = responses[ 3 ].value.payload ;
                    //console.log( 'setXYCoordinate: ' + JSON.stringify( payloadDTR ) ) ;
                    if( typeof payloadDTR.timeout === 'undefined' && typeof payloadDTR1.timeout === 'undefined' 
                            && typeof payloadEnableDT.timeout === 'undefined' && typeof payloadTmpStore.timeout === 'undefined' ) {
                        
                        //console.log( 'resolve setXYCoordinate: ' + JSON.stringify( responses ) ) ;
                        reject( payloadDTR ) ;
                    } else {
                        console.log( 'reject setXYCoordinate: ' + JSON.stringify( responses ) ) ;
                        reject( payloadDTR ) ;  
                    }
                }) ;
            }) ;
        }

        const setColourTemperature = function( msg : any, deviceType : number, value : number ) : any { 
            var promise = new Promise<void>( (resolve, reject) => {
                Promise.all([
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR.opcode + "0".toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR1.opcode + value.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR1.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.ENABLE_DEVICE_TYPE.opcode + deviceType.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.ENABLE_DEVICE_TYPE.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.DT8_SET_COLOUR_TEMPERATURE_TC.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.DT8_SET_COLOUR_TEMPERATURE_TC.name ) )    
                ]).then( () => {
                    resolve() ;
                }).catch( () => {
                    reject() ;
                }) ;
            }) ;
        }

        const setPrimaryNDimLevel = function( msg : any, deviceType : number, value : number, channel : number ) : any { 
            var promise = new Promise<void>( (resolve, reject) => {
                Promise.all([
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR.opcode + "0".toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR1.opcode + value.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR1.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR2.opcode + channel.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR2.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.ENABLE_DEVICE_TYPE.opcode + deviceType.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.ENABLE_DEVICE_TYPE.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.DT8_SET_PRIMARY_N_DIMLEVEL.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.DT8_SET_PRIMARY_N_DIMLEVEL.name ) )    
                ]).then( () => {
                    resolve() ;
                }).catch( () => {
                    reject() ;
                }) ;
            }) ;
        }

        const setRGBDimLevel = function( msg : any, deviceType : number, r : number, g : number, b : number ) : any { 
            var promise = new Promise<void>( (resolve, reject) => {
                Promise.all([
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR.opcode + r.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR1.opcode + g.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR1.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR2.opcode + b.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR2.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.ENABLE_DEVICE_TYPE.opcode + deviceType.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.ENABLE_DEVICE_TYPE.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.DT8_SET_RGB_DIMLEVEL.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.DT8_SET_RGB_DIMLEVEL.name ) )    
                ]).then( () => {
                    resolve() ;
                }).catch( () => {
                    reject() ;
                }) ;
            }) ;
        }

        const setWAFDimLevel = function( msg : any, deviceType : number, w : number, a : number ) : any { 
            var promise = new Promise<void>( (resolve, reject) => {
                Promise.allSettled([
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR.opcode + w.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR1.opcode + a.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR1.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.SET_DTR2.opcode + "0".toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.SET_DTR2.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.ENABLE_DEVICE_TYPE.opcode + deviceType.toString().padStart( 2,"0" ), 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.ENABLE_DEVICE_TYPE.name ) ),
                    executeRESICommand( nodeServer, RESICMD.DALI_CMD16.name + DALICMD.DT8_SET_WAF_DIMLEVEL.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.DALI_CMD16.name, DALICMD.DT8_SET_WAF_DIMLEVEL.name ) )    
                ]).then( ( responses : any[] ) => {
                    resolve() ;
                }).catch( () => {
                    reject() ;
                }) ;
            }) ;
        }
        const isResponsesValid = function( responses : any ) : any { 
            return new Promise<void>( (resolve, reject) => {
                let isValid = true ;

                if( typeof responses [ 0 ].value != 'undefined' && responses [ 0 ].value.payload.timeout ) {}
            }) ;
        } ;

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
            let deviceType = msg.payload.deviceType ;
            let scene = msg.payload.scene ;

            if( ! isInvalidMessageIn ) {
                Promise.allSettled([
                    ( typeof msg.payload.xCoordinate != 'undefined' 
                        ? setXYCoordinate( msg, deviceType, msg.payload.xCoordinate, DALICMD.DT8_SET_TEMPORARY_X_COORDINATE) : undefined),
                    ( typeof msg.payload.yCoordinate != 'undefined' 
                        ? setXYCoordinate( msg, deviceType, msg.payload.yCoordinate, DALICMD.DT8_SET_TEMPORARY_Y_COORDINATE) : undefined),
                    undefined, undefined
                ]).then( ( responses : any[] ) => {
                    console.log( 'onInput' + JSON.stringify( responses ) ) ;

                    if( true ) {
                        done() ;
                    } else {
                        send( buildErrorNodeMessage( msg, 'Error occurred' ) ) ;
                        done() ;
                    }
                })

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