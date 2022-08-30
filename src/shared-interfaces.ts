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



export const DALI_DEVICE_TYPES : { [key: number]: string } =  {
     0 : 'Fluorescent lamp control gear',
     1 : 'Self-contained emergency lamp control gear',
     2 : 'Discharge (HID) lamp control gear',
     3 : 'Low-voltage halogen lamp control gear',
     4 : 'Incandescent lamp dimmer',
     5 : 'DC voltage lamp dimmer (0/1-10V)',
     6 : 'LED lamp control gear',
     7 : 'witching (relay) control gear',
     8 : 'Color lamp control gear',
    15 : 'Load referencing',
    16 : 'Thermal gear protection',
    17 : 'Dimming curve selection',
    18 : 'Under consideration',
    19 : 'Centrally supplied emergency operation',
    20 : 'Demand response',
    21 : 'Thermal lamp protection',
    22 : 'Under consideration',
    23 : 'Non-replaceable light source'
} ;

export const DALICMD:any = {
    // Source: https://onlinedocs.microchip.com/pr/GUID-0CDBB4BA-5972-4F58-98B2-3F0408F3E10B-en-US-1/index.html?GUID-DA5EBBA5-6A56-4135-AF78-FB1F780EF475
    OFF : { 
        name : <string> 'OFF',
        opcode : <string> '0x00',
        description : <string> 'Switches off lamp(s)'
    },
    RECALL_MAX_LEVEL : { 
        name : <string> 'RECALL MAX LEVEL',
        opcode : <string> '0x05',
        description : <string> 'Changes the current light output to the maximum level'
    },
    RECALL_MIN_LEVEL : { 
        name : <string> 'RECALL MIN LEVEL',
        opcode : <string> '0x06',
        description : <string> 'Changes the current light output to the minimum level'
    },
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
    QUERY_PHYSICAL_MINIMUM: {
        name : <string> 'QUERY PHYSICAL MINIMUM',
        opcode : <string> '0x9A',
        description : <string> 'Returns the minimum light output that the control gear can operate at'
    },
    QUERY_CONTENT_DTR1: {
        name : <string> 'QUERY CONTENT DTR1',
        opcode : <string> '0x9C',
        description : <string> 'Returns the value of DTR1'
    },
    QUERY_CONTENT_DTR2: {
        name : <string> 'QUERY CONTENT DTR2',
        opcode : <string> '0x9D',
        description : <string> 'Returns the value of DTR2'
    },
    QUERY_ACTUAL_LEVEL : { 
        name : <string> 'QUERY ACTUAL LEVEL',
        opcode : <string> '0xA0',
        description : <string> 'Returns the control gear\'s actual power output level'
    },
    QUERY_MAX_LEVEL : { 
        name : <string> 'QUERY MAX LEVEL',
        opcode : <string> '0xA1',
        description : <string> 'Returns the control gear\'s maximum output setting'
    },
    QUERY_MIN_LEVEL : { 
        name : <string> 'QUERY MIN LEVEL',
        opcode : <string> '0xA2',
        description : <string> 'Returns the control gear\'s minimum output setting'
    },
    QUERY_POWER_ON_LEVEL : { 
        name : <string> 'QUERY POWER ON LEVEL',
        opcode : <string> '0xA3',
        description : <string> 'Returns the control gear\'s minimum output setting'
    },  
    QUERY_SYSTEM_FAILURE_LEVEL : { 
        name : <string> 'QUERY SYSTEM FAILURE LEVEL',
        opcode : <string> '0xA4',
        description : <string> 'Returns the value of the intensity level due to a system failure'
    },  
    QUERY_FADE_TIME_FADE_RATE : { 
        name : <string> 'QUERY FADE TIME FADE RATE',
        opcode : <string> '0xA5',
        description : <string> 'Returns a byte in which the upper nibble is equal to the fade time value and the lower nibble is the fade rate value'
    },   
    QUERY_SCENE_LEVEL : { 
        name : <string> 'QUERY SCENE LEVEL',
        opcode : <string> '0xB0',
        description : <string> 'Returns the level value of scene \'x\''
    },   
    QUERY_GROUPS_0_7 : { 
        name : <string> 'QUERY GROUPS 0-7',
        opcode : <string> '0xC0',
        description : <string> 'Returns a byte in which each bit represents a member of a group. A \'1\' represents a member of the group'
    },     
    QUERY_GROUPS_8_15 : { 
        name : <string> 'QUERY GROUPS 8-15',
        opcode : <string> '0xC1',
        description : <string> 'Returns a byte in which each bit represents a member of a group. A \'1\' represents a member of the group'
    },      

}

export const RESICMD:any = {
    LAMP : {
        name : <string> '#LAMP '
    },
    LAMP_COMMAND_ANSWER : {
        name : <string> '#LAMP COMMAND ANSWER:'
    },
    LAMP_RGBWAF : {
        name : <string> '#LAMP RGBWAF:'
    },
    LAMP_QUERY_RGBWAF : {
        name : <string> '#LAMP QUERY RGBWAF:'
    }
}

export const RESIRESP:any = {
    OK : {
        name : <string> '#OK'
    }
}