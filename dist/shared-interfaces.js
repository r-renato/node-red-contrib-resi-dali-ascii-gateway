"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESIRESP = exports.RESICMD = exports.DALICMD = exports.DALI_DEVICE_TYPES = void 0;
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
exports.DALI_DEVICE_TYPES = {
    0: 'Fluorescent lamp control gear',
    1: 'Self-contained emergency lamp control gear',
    2: 'Discharge (HID) lamp control gear',
    3: 'Low-voltage halogen lamp control gear',
    4: 'Incandescent lamp dimmer',
    5: 'DC voltage lamp dimmer (0/1-10V)',
    6: 'LED lamp control gear',
    7: 'witching (relay) control gear',
    8: 'Color lamp control gear',
    15: 'Load referencing',
    16: 'Thermal gear protection',
    17: 'Dimming curve selection',
    18: 'Under consideration',
    19: 'Centrally supplied emergency operation',
    20: 'Demand response',
    21: 'Thermal lamp protection',
    22: 'Under consideration',
    23: 'Non-replaceable light source'
};
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
    STORE_ACTUAL_LEVEL_IN_DTR: {
        name: 'STORE ACTUAL LEVEL IN DTR',
        opcode: '0x21',
        description: 'Determines the control gear\'s status based on a combination of gear properties'
    },
    STORE_THE_DTR_AS_MAX_LEVEL: {
        name: 'STORE THE DTR AS MAX LEVEL',
        opcode: '0x2A',
        description: 'Stores the actual register value DTR as maximum level for lamp'
    },
    STORE_THE_DTR_AS_MIN_LEVEL: {
        name: 'STORE THE DTR AS MIN LEVEL',
        opcode: '0x2B',
        description: 'Stores the actual register value DTR as minimum level for lamp'
    },
    STORE_DTR_AS_SYSTEM_FAILURE_LEVEL: {
        name: 'STORE DTR AS SYSTEM FAILURE LEVEL',
        opcode: '0x2C',
        description: 'Stores the actual register value DTR as system failure level for lamp'
    },
    STORE_DTR_AS_POWER_ON_LEVEL: {
        name: 'STORE DTR AS POWER ON LEVEL',
        opcode: '0x2D',
        description: 'Stores the actual register value DTR as power on level for lamp'
    },
    STORE_DTR_AS_FADETIME: {
        name: 'STORE DTR AS FADETIME',
        opcode: '0x2E',
        description: 'Stores the actual register value DTR as fade time for lamp'
    },
    STORE_DTR_AS_FADERATE: {
        name: 'STORE DTR AS FADERATE',
        opcode: '0x2F',
        description: 'Stores the actual register value DTR as fade rate for lamp'
    },
    STORE_THE_DTR_AS_SCENE_0: {
        name: 'STORE THE DTR AS SCENE 0',
        opcode: '0x40',
        description: 'Stores the actual register value DTR as new brightness level forscene x (0 to 15)'
    },
    //TO-DO
    STORE_THE_DTR_AS_SCENE_15: {
        name: 'STORE THE DTR AS SCENE 15',
        opcode: '0x40F',
        description: 'Stores the actual register value DTR as new brightness level forscene x (0 to 15)'
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
    LAMP_OFF: {
        name: '#LAMP OFF:'
    },
    LAMP_LEVEL: {
        name: '#LAMP LEVEL:'
    },
    LAMP_COMMAND: {
        name: '#LAMP COMMAND:'
    },
    LAMP_COMMAND_ANSWER: {
        name: '#LAMP COMMAND ANSWER:'
    },
    LAMP_RGBWAF: {
        name: '#LAMP RGBWAF:'
    },
    LAMP_QUERY_RGBWAF: {
        name: '#LAMP QUERY RGBWAF:'
    },
    LAMP_XY: {
        name: '#LAMP XY:'
    },
    LAMP_XY_DIGITS: {
        name: '#LAMP XY DIGITS:'
    },
    LAMP_QUERY_XY: {
        name: '#LAMP QUERY XY:'
    }
};
exports.RESIRESP = {
    OK: {
        name: '#OK'
    }
};
//# sourceMappingURL=shared-interfaces.js.map