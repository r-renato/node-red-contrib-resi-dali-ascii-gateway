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
    // Source: https://onlinedocs.microchip.com/pr/GUID-0CDBB4BA-5972-4F58-98B2-3F0408F3E10B-en-US-1/index.html?GUID-DA5EBBA5-6A56-4135-AF78-FB1F780EF475
    OFF: {
        name: 'OFF',
        opcode: '0x00',
        description: 'Switches off lamp(s)'
    },
    RECALL_MAX_LEVEL: {
        name: 'RECALL MAX LEVEL',
        opcode: '0x05',
        description: 'Changes the current light output to the maximum level'
    },
    RECALL_MIN_LEVEL: {
        name: 'RECALL MIN LEVEL',
        opcode: '0x06',
        description: 'Changes the current light output to the minimum level'
    },
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
    QUERY_PHYSICAL_MINIMUM: {
        name: 'QUERY PHYSICAL MINIMUM',
        opcode: '0x9A',
        description: 'Returns the minimum light output that the control gear can operate at'
    },
    QUERY_CONTENT_DTR1: {
        name: 'QUERY CONTENT DTR1',
        opcode: '0x9C',
        description: 'Returns the value of DTR1'
    },
    QUERY_CONTENT_DTR2: {
        name: 'QUERY CONTENT DTR2',
        opcode: '0x9D',
        description: 'Returns the value of DTR2'
    },
    QUERY_ACTUAL_LEVEL: {
        name: 'QUERY ACTUAL LEVEL',
        opcode: '0xA0',
        description: 'Returns the control gear\'s actual power output level'
    },
    QUERY_MAX_LEVEL: {
        name: 'QUERY MAX LEVEL',
        opcode: '0xA1',
        description: 'Returns the control gear\'s maximum output setting'
    },
    QUERY_MIN_LEVEL: {
        name: 'QUERY MIN LEVEL',
        opcode: '0xA2',
        description: 'Returns the control gear\'s minimum output setting'
    },
    QUERY_POWER_ON_LEVEL: {
        name: 'QUERY POWER ON LEVEL',
        opcode: '0xA3',
        description: 'Returns the control gear\'s minimum output setting'
    },
    QUERY_SYSTEM_FAILURE_LEVEL: {
        name: 'QUERY SYSTEM FAILURE LEVEL',
        opcode: '0xA4',
        description: 'Returns the value of the intensity level due to a system failure'
    },
    QUERY_FADE_TIME_FADE_RATE: {
        name: 'QUERY FADE TIME FADE RATE',
        opcode: '0xA5',
        description: 'Returns a byte in which the upper nibble is equal to the fade time value and the lower nibble is the fade rate value'
    },
    QUERY_SCENE_LEVEL: {
        name: 'QUERY SCENE LEVEL',
        opcode: '0xB0',
        description: 'Returns the level value of scene \'x\''
    },
    QUERY_GROUPS_0_7: {
        name: 'QUERY GROUPS 0-7',
        opcode: '0xC0',
        description: 'Returns a byte in which each bit represents a member of a group. A \'1\' represents a member of the group'
    },
    QUERY_GROUPS_8_15: {
        name: 'QUERY GROUPS 8-15',
        opcode: '0xC1',
        description: 'Returns a byte in which each bit represents a member of a group. A \'1\' represents a member of the group'
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