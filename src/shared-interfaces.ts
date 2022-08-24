import * as nodered from "node-red" ;
import { NodeRESIClientInterface } from './shared-classes' ;

export interface NodeExtendedInterface extends nodered.Node {
    connection: NodeRESIClientInterface,
    getStatusBroadcaster : any
}

export interface TelnetEngineInterface {
    engine: any ;
    proxy: any ;
    // timeOut: number ;
    // clearOut: number ;
    // inDelimiter: string ;
    // outDelimiter: string ;
    // modeStrict: boolean ;
    // autoFlush: number ;
    statusBroadcaster: any ;

    systemConsole: boolean ;
    logEnabled: boolean ;
}

export interface RESIResponseInterface extends nodered.NodeMessage {
    payload : any ;
    daliRequest : any ;
    error?: object ;

}

// export interface RESIConnectionInterface {
//     client: any ;
//     clientConnectionParams : {
//         address : string ;
//         port : number ; 
//     }

//     statusBroadcaster: any ;

//     systemConsole: boolean ;
//     logEnabled: boolean ;
// }