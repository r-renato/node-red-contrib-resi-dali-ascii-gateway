"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESIRESP = exports.RESICMD = exports.DALICMD = void 0;
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
exports.DALICMD = {
    QUERY_STATUS: {
        name: 'QUERY STATUS',
        opcode: '0x90',
        description: 'Determines the control gear\'s status based on a combination of gear properties'
    },
    QUERY_CONTROL_GEAR_PRESENT: {
        name: 'QUERY CONTROL GEAR PRESENT',
        opcode: '0x91',
        description: 'Determines if a control gear is present'
    },
    QUERY_VERSION_NUMBER: {
        name: 'QUERY VERSION NUMBER',
        opcode: '0x97',
        description: 'Returns the device\'s version number located in memory bank 0, location 0x16'
    },
    QUERY_DEVICE_TYPE: {
        name: 'QUERY DEVICE TYPE',
        opcode: '0x99',
        description: 'Determines the device type supported by the control gear'
    },
    QUERY_ACTUAL_LEVEL: {
        name: 'QUERY ACTUAL LEVEL',
        opcode: '0xA0',
        description: 'Returns the control gear\'s actual power output level'
    },
};
exports.RESICMD = {
    LAMP: {
        name: '#LAMP '
    },
    LAMP_COMMAND_ANSWER: {
        name: '#LAMP COMMAND ANSWER:'
    }
};
exports.RESIRESP = {
    OK: {
        name: '#OK'
    }
};
//# sourceMappingURL=shared-interfaces.js.map