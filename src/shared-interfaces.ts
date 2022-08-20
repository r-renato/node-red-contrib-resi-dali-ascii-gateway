import * as nodered from "node-red" ;


export interface NodeExtendedInterface extends nodered.Node {
    connection: any,
    getStatusBroadcaster : any
}

export interface TelnetEngineInterface {
    engine: any ;
    timeOut: number ;
    clearOut: number ;
    inDelimiter: string ;
    outDelimiter: string ;
    modeStrict: boolean ;
    autoFlush: number ;
    statusBroadcaster: any ;
}