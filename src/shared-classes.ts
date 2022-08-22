import * as nodered from "node-red" ;
import { NodeExtendedInterface, TelnetEngineInterface } from './shared-interfaces' ;

export interface StatusInterface {
    setStatus( state: boolean ) : void ;
    getStatus() : nodered.NodeStatus ;
    getStatusBroadcasting() : any ;
}

export class Status implements StatusInterface {
    private node: nodered.Node ;
    private statusSender: any ;

    private statusBroadcasting:any = null ;
    private statusResetter: any = null ;
    private statusVal: nodered.NodeStatus = { fill: "grey", shape: "ring", text: "idle" } ;

    constructor( node: nodered.Node, nodeServer: NodeExtendedInterface ) { 
        this.node = node ;
        this.statusSender = nodeServer.getStatusBroadcaster();
        
        this.statusBroadcasting = this.statusSender.thenAgain(
            (st: any) => {
                this.statusVal = Object.assign( this.statusVal, st ) ;
                node.status( this.statusVal ) ;
            })
    } ;

    public setStatus = ( state: boolean ) : void => {
        this.statusVal = { fill: "grey", shape: "ring", text: "idle" } ;

        clearTimeout( this.statusResetter) ;
        if ( state ) {
            this.statusVal[ 'shape' ] = "dot"    
            this.statusResetter = setTimeout(() => { this.setStatus(false) }, 500)
        }
        else {
            this.statusVal['shape'] = "ring"
        }
        this.node.status( this.statusVal ) ;
    }

    public getStatus = () : nodered.NodeStatus => {
        return( this.statusVal ) ;
    }

    public getStatusBroadcasting = () : any => {
        return( this.statusBroadcasting ) ;
    }
} ;