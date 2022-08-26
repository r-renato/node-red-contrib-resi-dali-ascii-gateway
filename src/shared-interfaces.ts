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


export const DALICMD:any = {
    QUERY_STATUS : { 
        name : <string> 'QUERY STATUS',
        opcode : <string> '0x90',
        description : <string> 'Determines the control gear\'s status based on a combination of gear properties'
    },
    QUERY_CONTROL_GEAR_PRESENT : { 
        name : <string> 'QUERY CONTROL GEAR PRESENT',
        opcode : <string> '0x91',
        description : <string> 'Determines if a control gear is present'
    },
    QUERY_VERSION_NUMBER : { 
        name : <string> 'QUERY VERSION NUMBER',
        opcode : <string> '0x97',
        description : <string> 'Returns the device\'s version number located in memory bank 0, location 0x16'
    },
    QUERY_DEVICE_TYPE : { 
        name : <string> 'QUERY DEVICE TYPE',
        opcode : <string> '0x99',
        description : <string> 'Determines the device type supported by the control gear'
    },
    QUERY_ACTUAL_LEVEL : { 
        name : <string> 'QUERY ACTUAL LEVEL',
        opcode : <string> '0xA0',
        description : <string> 'Returns the control gear\'s actual power output level'
    },
}

export const RESICMD:any = {
    LAMP : {
        name : <string> '#LAMP '
    },
    LAMP_COMMAND_ANSWER : {
        name : <string> '#LAMP COMMAND ANSWER:'
    }
}

export const RESIRESP:any = {
    OK : {
        name : <string> '#OK'
    }
}