import * as nodered from "node-red" ;
import { NodeExtendedInterface, TelnetEngineInterface } from './shared-interfaces' ;

var telnetEngingLib = require( "telnet-engine" ) ;

interface NodeExtended extends nodered.Node {
    connection: any,
    getStatusBroadcaster : any
}

module.exports = function (RED: nodered.NodeAPI) {

    RED.nodes.registerType("dali-command",
    function (this: nodered.Node, config: any): void {
        RED.nodes.createNode(this, config);

        var node = this;
        var telnetEngine: TelnetEngineInterface ;
        var nodeServer = <NodeExtended> RED.nodes.getNode( config.server ) ;
        var statusBroadcasting:any = null ;
        var statusVal:nodered.NodeStatus = { fill: "grey", shape: "ring", text: "idle" } ;
        var statusResetter: any = null;

        if( nodeServer ) {
            telnetEngine = <TelnetEngineInterface> nodeServer.connection ;
            var statusSender = nodeServer.getStatusBroadcaster();
            statusBroadcasting = statusSender.thenAgain(
                (st: any) => {
                    statusVal = Object.assign( statusVal, st ) ;
                    this.status( statusVal ) ;
                })
        }
        
        const setStatus = ( state: boolean ) => {
            clearTimeout(statusResetter);
            if (state) {
                statusVal['shape'] = "dot"    
                statusResetter = setTimeout(() => { setStatus(false) }, 500)
            }
            else {
                statusVal['shape'] = "ring"
            }
            this.status(statusVal);
        }

        setStatus(false);

        this.on("input", async (msg: any, send, done) => {
            this.log( "T1 => " + (telnetEngine ? true : false) + " msg: " + msg.payload.toString()) ;
            if( telnetEngine ) {
                this.log( "T2 => " + (telnetEngine ? true : false) + " msg: " + msg.payload.toString()) ;
                setStatus(true);
                telnetEngine.engine.listenString(console.log) ;
                telnetEngine.engine.request({request: msg.payload.toString(), test: telnetEngingLib.untilMilli(1000), 
                    foo: (obj: any) => {
                        console.log( ">" + obj.response + "<") ;
                        var msg1 = Object.assign({}, msg)
                        msg1.payload = obj.response
                        send([msg1, ,])
                        return obj.response.length ;
                    }, UID: "REQ123" })
                .then( () => {
                    console.log( "done.")
                })
                .catch( () => {
                    console.log("error:","REQ123")
                } ) ;



                // telnetEngine.engine.requestString( msg.payload.toString() + "\n\r", telnetEngingLib.untilMilli( 100 ) )
                //     .then(( s:any )=>{ console.log("3=== found the prompt: " + s ) })
                //     .catch(()=>{console.log("4=== couldn't find the prompt")})
                //     .finally(()=>{console.log("5=== finished"); telnetEngine.engine.terminate()
                // }) ;
                telnetEngine.engine.terminate() ;
            }

            // this.status({
            //     fill:"green",
            //     shape:"dot",
            //     text: "{address:"
            //         + msg.payload.address
            //         + ", value:" + msg.payload.value 
            //         + (typeof msg.payload.secondPaylod == "undefined" 
            //             ? "" 
            //             : ", {0x" 
            //                 + msg.payload.secondPaylod[0].toString(16)
            //                 + ", 0x" 
            //                 + msg.payload.secondPaylod[1].toString(16)
            //                 + "}" 
            //             )
            //         + "}"
            // });

            // send(msg);
            done();
        });

        this.on("close", async () => {
            if (statusBroadcasting) { statusBroadcasting.resolve(); }
        });
        
    });
    
} 