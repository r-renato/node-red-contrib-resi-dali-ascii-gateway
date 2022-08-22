import * as nodered from "node-red" ;
import { NodeExtendedInterface, TelnetEngineInterface } from './shared-interfaces' ;
import { Status, StatusInterface } from './shared-classes' ;
import { objectRename } from './shared-functions' ;

const daliLampLevelNodeName:string = "dali-lamp-level" ;
const telnetEngingLib = require( "telnet-engine" ) ;

module.exports = function (RED: nodered.NodeAPI) {

    RED.nodes.registerType( daliLampLevelNodeName,
    function (this: nodered.Node, config: any): void {
        RED.nodes.createNode(this, config);
        var node = this;

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
                var textCommand: string = "#LAMP LEVEL:" 
                    + (msg.payload.lamp | config.lamp)
                    + "=" 
                    + (msg.payload.level | config.level) ;

                console.log( "log: " + telnetEngine.systemConsole ) ;
                if( telnetEngine.systemConsole ) {
                    telnetEngine.engine.listenString( console.log ) ;
                    node.log( "Sending command: " + textCommand ) ;
                }

                telnetEngine.proxy.request({
                    request: textCommand.toString(), 
                    test: telnetEngingLib.untilMilli( 1500 ), 
                    foo: (obj: any) => {
                        return obj ;
                    }
                    //, UID: "REQ123" 
                })
                .then( ( obj: any ) => {
                        var result : any = Object.assign({}, msg)
                        result = objectRename( result, 'payload', 'daliRequest' ) ;
                        
                        if( telnetEngine.systemConsole ) {
                            console.log( textCommand + " ==> " + obj.response ) ;
                        }

                        if( obj.response == "#OK" ) {
                            result.payload = "#OK" ;
                        } else {
                            // Error
                        }

                        //console.log( ">" + obj.response + "<") ;
                        //var msg1 = Object.assign({}, msg)
                        //msg1.payload = obj.response
                        send([result, ,])
                    console.log( ">done.")
                })
                .catch( (a:any, b:any, c:any) => {
                    console.log("error:","REQ123" +(typeof a) + "-" + b + c )
                } ) ;
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