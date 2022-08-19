import * as nodered from "node-red" ;

var telnetEngingLib = require( "telnet-engine" ) ;

class TelnetEnginePool {
    private static instance: TelnetEnginePool;
    private engines: {[key: string]: any } = {} ;

    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() { }

    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    public static getInstance(): TelnetEnginePool {
        if (!TelnetEnginePool.instance) {
            TelnetEnginePool.instance = new TelnetEnginePool();
        }

        return TelnetEnginePool.instance;
    }

    public getEngine() {
        // ...
    }
}

var telnetEngine = TelnetEnginePool.getInstance ;

module.exports = function (RED: nodered.NodeAPI) {

    RED.nodes.registerType("dali-command",
    function (this: nodered.Node, config: any): void {
        RED.nodes.createNode(this, config);
        
        this.on("input", async (msg: any, send, done) => {

            this.status({
                fill:"green",
                shape:"dot",
                text: "{address:"
                    + msg.payload.address
                    + ", value:" + msg.payload.value 
                    + (typeof msg.payload.secondPaylod == "undefined" 
                        ? "" 
                        : ", {0x" 
                            + msg.payload.secondPaylod[0].toString(16)
                            + ", 0x" 
                            + msg.payload.secondPaylod[1].toString(16)
                            + "}" 
                        )
                    + "}"
            });

            send(msg);
            done();
        });
    });
    
} 