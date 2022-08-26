import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface, DALICMD, RESICMD } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, invalidPayloadIn, executeDALICommand, buildNodeMessage } from './shared-functions' ;
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

        // const executeDALICommand = function( textCommand : string, msg : any ) : Promise<nodered.NodeMessage> {
        //     return new Promise( ( resolve, reject ) => {
        //         if( resiClient.isSystemConsole() ) node.log( "Try to sending command: " + textCommand ) ;

        //         nodeServer.connection.send( textCommand ).then( ( response ) => {
        //             //console.log( ">>> " + JSON.stringify( response ) ) ;
        //             var result = <RESIResponseInterface> Object.assign({}, msg)
        //             result = objectRename( result, 'payload', 'daliRequest' ) ;
        //             result.payload = prepareDALIResponse( msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ) ;
        //             result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
        //             //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
        //             resolve(<nodered.NodeMessage> result) ;
        //         })
        //     }) ;
        // }

        // const prepareNodeMessage = function( srcmsg : any, command : string, action: string ) : any {
        //     let msg =  Object.assign({}, srcmsg) ; msg.payload = {} ;
        //     msg.payload.command = command ; msg.payload.action = action ; msg.payload.params = ':' + srcmsg.payload.lamp ;
        //     return( msg ) ;
        // }

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
                var queryStatusCmd = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0x90' ;
                var queryActualLevel = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0xA0' ;
                var queryActualLevel = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0x99' ;

                executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_CONTROL_GEAR_PRESENT.opcode, 
                    buildNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_CONTROL_GEAR_PRESENT.name ) )
                .then( ( response : any ) => {
                    console.log( "response: " + JSON.stringify( response ) ) ;
                    if( response.payload.done && typeof response.payload.timeout == 'undefined' ) {
                        // ok
                        Promise.allSettled([
                            executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_STATUS.opcode, 
                                buildNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_STATUS.name ) ),
                            executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_ACTUAL_LEVEL.opcode, 
                                buildNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_ACTUAL_LEVEL.name ) ),
                            executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_DEVICE_TYPE.opcode, 
                                buildNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_DEVICE_TYPE.name ) ),

                        ])
                        done() ;
                    } else {
                        // Timeout
                        send(<nodered.NodeMessage> response) ;
                        done() ;
                    }
                }).catch( () => {

                }) ;

                // Promise.allSettled([
                //     executeDALICommand( RESICMD.LAMP_COMMAND_ANSWER + msg.payload.lamp + '=' + DALICMD.QUERY_STATUS.opcode, 
                //         prepareNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_STATUS.name ) ),
                //     executeDALICommand( lampCommandAnswerCommandConst + msg.payload.lamp + '=0xA0', 
                //         prepareNodeMessage( msg, defaultCommandConst, queryActualLevelCommandConst) ),

                //     executeDALICommand( queryStatusCmd, msg1 ),
                //     executeDALICommand( queryActualLevel, msg2)
                // ]).then( ( responses ) => {
                //     let result1 = (<any> responses[ 0 ]).value.daliRequest.action == 'QUERY STATUS' 
                //         ? (<any> responses[ 0 ]).value : (<any> responses[ 1 ]).value ;
                //     let result2 = (<any> responses[ 0 ]).value.daliRequest.action == 'QUERY ACTUAL LEVEL' 
                //         ? (<any> responses[ 0 ]).value : (<any> responses[ 1 ]).value ;

                //     result1 = objectRename( result1, 'daliRequest', 'daliRequest1' ) ;
                //     result1.daliRequest2 = Object.assign({}, result2.daliRequest) ;

                //     result1 = objectRename( result1, 'payload', 'daliResponse1' ) ;
                //     result1.daliResponse2 = Object.assign({}, result2.payload) ;

                //     // console.log( "result1 => " + JSON.stringify( result1 ) ) ;
                //     // console.log( "result2 => " + JSON.stringify( result2 ) ) ;

                //     result1.payload = {
                //         done : true
                //     } ;

                //     if( typeof result1.daliResponse1.timeout == 'undefined' && typeof result1.daliResponse2.timeout == 'undefined' ) {
                //         result1.payload.powerOn = result1.daliResponse1.lampArcPowerOn ;
                //         result1.payload.level = result1.daliResponse2.value ;
                //         result1.payload.isPowerOn = ( result1.daliResponse1.lampArcPowerOn && result1.daliResponse2.value > 0 ) ;
                //     } else {
                //         result1.payload.timeout = true ;
                //     }

                //     send( <nodered.NodeMessage> result1 ) ;
                // }).catch( ( e ) => {
                //     console.log( 'erroreeee' + e ) ;
                // }) ;

                //status.setStatus( true ) ;

                // nodeServer.connection.send( textCommand ).then( ( response ) => {
                //     var result = <RESIResponseInterface> Object.assign({}, msg) ;
                //     result = objectRename( result, 'payload', 'daliRequest' ) ;
                //     result.payload = prepareDALIResponse( msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ) ;
                //     result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
                //     //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
                //     send(<nodered.NodeMessage> result) ;
                // }).catch( ( error ) => {
                //     var result : any = Object.assign({}, msg) ;
                //     result.error = {
                //         message : error,
                //         source : {
                //             id : nodeServer.id,
                //             type : nodeServer.type,
                //             name : nodeServer.name
                //         }
                //     } ;
                //     send([result, ,])
                // }) ;
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