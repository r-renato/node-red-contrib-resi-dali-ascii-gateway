import * as nodered from "node-red" ;
import { NodeExtendedInterface, TelnetEngineInterface } from './shared-interfaces' ;
import { Status, StatusInterface } from './shared-classes' ;
import { objectRename, requestTimeout } from './shared-functions' ;

const daliLampLevelNodeName:string = "dali-lamp-level" ;
const daliCommand: string = "#LAMP LEVEL" 
const telnetEngingLib = require( "telnet-engine" ) ;

module.exports = function (RED: nodered.NodeAPI) {

    RED.nodes.registerType( daliLampLevelNodeName,
    function (this: nodered.Node, config: any): void {
        RED.nodes.createNode(this, config);
        var node: nodered.Node = this;

        var nodeServer = <NodeExtendedInterface> RED.nodes.getNode( config.server ) ;
        var telnetEngine: TelnetEngineInterface ;
        var status: StatusInterface ;

        if( nodeServer ) {
            status = new Status( node, nodeServer ) ;
            telnetEngine = <TelnetEngineInterface> nodeServer.connection ;

            status.setStatus( false ) ;
        }

        /**
         * 
         */
        this.on("input", async (msg: any, send, done) => {
            if( telnetEngine ) {
                status.setStatus( true ) ;
                var textCommand: string = daliCommand + ":" 
                    + (msg.payload.lamp | config.lamp)
                    + "=" 
                    + (msg.payload.level | config.level) ;

                console.log( "log: " + telnetEngine.systemConsole ) ;
                if( telnetEngine.systemConsole ) {
                    telnetEngine.engine.listenString( console.log ) ;
                    node.log( "Sending command: " + textCommand ) ;
                }

                requestTimeout(2000, 
                    telnetEngine.proxy.request({
                        request: textCommand.toString(), 
                        test: telnetEngingLib.untilMilli( 1500 ), 
                        foo: (obj: any) => {
                            return obj ;
                        }
                        , UID: node.id 
                    })
                    ).then( (obj) => {
                        //console.log( obj + JSON.stringify( obj ) ) ;
                        var result : any = Object.assign({}, msg)
                        result = objectRename( result, 'payload', 'daliRequest' ) ;
                        
                        if( telnetEngine.systemConsole ) {
                            node.log( obj[0].request + " ==> " + obj[0].response ) ;
                        }

                        result.payload = obj[0].response ;
                        telnetEngine.engine.destroy() ;
                        send([result, ,])
                    }).catch((e) => {
                        if( telnetEngine.systemConsole ) {
                            console.log( "ERROR! " + e ) ;
                        }
                        
                        var result : any = Object.assign({}, msg) ;
                        result.error = {
                            message : e,
                            source : {
                                id : nodeServer.id,
                                type : nodeServer.type,
                                name : nodeServer.name
                            }
                        } ;
                        send([result, ,])
                        telnetEngine.engine.destroy() ;
                    }) ;
            }

            done() ;
        });

        /**
         * 
         */
        this.on( "close", async () => {
            if( telnetEngine.systemConsole ) {
                node.log( "close" ) ;
            }
            if( telnetEngine ) {
                if ( status.getStatusBroadcasting() ) { status.getStatusBroadcasting().resolve(); }
            }
        });

    });
    
} 