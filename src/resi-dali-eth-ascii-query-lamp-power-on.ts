import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface } from './shared-interfaces' ;
import { Status, StatusInterface, NodeRESIClientInterface } from './shared-classes' ;
import { objectRename, invalidPayloadIn, prepareDALIResponse } from './shared-functions' ;
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

        const executeDALICommand = function( textCommand : string, msg : any ) : Promise<nodered.NodeMessage> {
            return new Promise( ( resolve, reject ) => {
                nodeServer.connection.send( textCommand ).then( ( response ) => {
                    console.log( ">>> " + JSON.stringify( response ) ) ;
                    var result = <RESIResponseInterface> Object.assign({}, msg)
                    result = objectRename( result, 'payload', 'daliRequest' ) ;
                    result.payload = prepareDALIResponse( msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ) ;
                    result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
                    //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
                    resolve(<nodered.NodeMessage> result) ;
                })
            }) ;
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
                var queryStatusCmd = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0x90' ;
                var queryActualLevel = '#LAMP COMMAND ANSWER:' + msg.payload.lamp + '=0xA0' ;

                if( resiClient.isSystemConsole() ) {
                    node.log( "Try to sending command: " + queryStatusCmd ) ;
                    node.log( "Try to sending command: " + queryActualLevel ) ;
                }

                let msg1 =  Object.assign({}, msg) ; msg1.payload = {} ;
                msg1.payload.command = 'LAMP' ; msg1.payload.action = 'QUERY STATUS' ; msg1.payload.params = '' ;
                let msg2 =  Object.assign({}, msg) ; msg2.payload = {} ;
                msg2.payload.command = 'LAMP' ; msg2.payload.action = 'QUERY ACTUAL LEVEL' ; msg2.payload.params = '' ;

                Promise.allSettled([
                    executeDALICommand( queryStatusCmd, msg1 ),
                    executeDALICommand( queryActualLevel, msg2)
                ]).then( ( responses ) => {
                    let result1 = (<any> responses[ 0 ]).value.daliRequest.action == 'QUERY STATUS' 
                        ? (<any> responses[ 0 ]).value : (<any> responses[ 1 ]).value ;
                    let result2 = (<any> responses[ 0 ]).value.daliRequest.action == 'QUERY ACTUAL LEVEL' 
                        ? (<any> responses[ 0 ]).value : (<any> responses[ 1 ]).value ;

                    console.log( "result1 => " + JSON.stringify( result1 ) ) ;
                    console.log( "result2 => " + JSON.stringify( result2 ) ) ;
                    
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