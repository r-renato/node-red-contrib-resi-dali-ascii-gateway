import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface, DALICMD, RESICMD  } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, invalidPayloadIn, executeDALICommand, buildRequestNodeMessage } from './shared-functions' ;
import { doesNotMatch } from "assert";

const daliLampLevelNodeName:string = "dali-query-lamp-power-on" ;

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
      
            if( !(isValid && Object.prototype.hasOwnProperty.call( msg.payload, 'lamp' )) ) { 
                node.error( 'lamp attribute Not Found', msg ) ;
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

        // const executeDALICommand = function( textCommand : string, msg : any ) : Promise<nodered.NodeMessage> {
        //     return new Promise( ( resolve, reject ) => {
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
                // var queryStatusCmd = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0x90' ;
                // var queryActualLevel = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0xA0' ;

                // if( resiClient.isSystemConsole() ) {
                //     node.log( "Try to sending command: " + queryStatusCmd ) ;
                //     node.log( "Try to sending command: " + queryActualLevel ) ;
                // }

                // let msg1 =  Object.assign({}, msg) ; msg1.payload = {} ;
                // msg1.payload.command = 'LAMP' ; msg1.payload.action = 'QUERY STATUS' ; msg1.payload.params = ':' + msg.payload.lamp ;
                // let msg2 =  Object.assign({}, msg) ; msg2.payload = {} ;
                // msg2.payload.command = 'LAMP' ; msg2.payload.action = 'QUERY ACTUAL LEVEL' ; msg2.payload.params = ':' + msg.payload.lamp ;

                Promise.allSettled([
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_STATUS.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_STATUS.name ) ),
                    executeDALICommand( nodeServer, RESICMD.LAMP_COMMAND_ANSWER.name + msg.payload.lamp + '=' + DALICMD.QUERY_ACTUAL_LEVEL.opcode, 
                        buildRequestNodeMessage( msg, RESICMD.LAMP.name, DALICMD.QUERY_ACTUAL_LEVEL.name ) ),
                ]).then( ( responses ) => {
                    let result1 = (<any> responses[ 0 ]).value.daliRequest.action == DALICMD.QUERY_STATUS.name 
                        ? (<any> responses[ 0 ]).value : (<any> responses[ 1 ]).value ;
                    let result2 = (<any> responses[ 0 ]).value.daliRequest.action == DALICMD.QUERY_ACTUAL_LEVEL.name 
                        ? (<any> responses[ 0 ]).value : (<any> responses[ 1 ]).value ;

                    result1 = objectRename( result1, 'daliRequest', 'daliRequest1' ) ;
                    result1.daliRequest2 = Object.assign({}, result2.daliRequest) ;

                    result1 = objectRename( result1, 'payload', 'daliResponse1' ) ;
                    result1.daliResponse2 = Object.assign({}, result2.payload) ;

                    // console.log( "result1 => " + JSON.stringify( result1 ) ) ;
                    // console.log( "result2 => " + JSON.stringify( result2 ) ) ;

                    result1.payload = {
                        done : true
                    } ;

                    if( typeof result1.daliResponse1.timeout == 'undefined' && typeof result1.daliResponse2.timeout == 'undefined' ) {
                        result1.payload.powerOn = result1.daliResponse1.lampArcPowerOn ;
                        result1.payload.level = result1.daliResponse2.value ;
                        result1.payload.isPowerOn = ( result1.daliResponse1.lampArcPowerOn && result1.daliResponse2.value > 0 ) ;
                    } else {
                        result1.payload.timeout = true ;
                    }

                    send( <nodered.NodeMessage> result1 ) ;
                }).catch( ( e ) => {
                    console.log( 'erroreeee' + e ) ;
                }) ;

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