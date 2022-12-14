import * as nodered from "node-red" ;
import { NodeExtendedInterface, TelnetEngineInterface } from './shared-interfaces' ;

const uuid = require( 'uuid' ) ;
const openpromiseLib = require( 'openpromise' ) ;
const { Telnet } = require('telnet-client') ;

type ConnectionState = null | 'closed' | 'connecting' | 'connected' | 'failedconnect'  ;

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

/**
 * 
 */
export class RESIClient {
    private uid : string ;
    private systemConsole : boolean ;
    private logEnabled : boolean ;

    private client : any ;
    private parameters : { host : string, port : number, timeout : number } =  { 
        host : '', port : -1, timeout : 2000
    } ;

    private operationsTimeout : number = 60000 ;
    private lockWaitTimeout : number = 200 ;

    private connectionState : ConnectionState = null ;

    private requestQueue : any ;

    /**
     * 
     * @param test 
     * @param ms 
     * @returns 
     */
    protected async waitFor( test : () => boolean, ms : number, msg ?: string ) : Promise<any> {
        return new Promise( ( resolve, reject ) => {
            let timeout = 3 ;
            let timerId = setInterval( () => {
                if( test() ) {
                    clearInterval(timerId);
                    resolve( true ) ;
                  } else {
                    timeout-- ; 
                    if( this.systemConsole ) this.logger( 
                        (typeof msg === 'undefined' ? "waitFor timeout: " : msg + " => waitFor timeout: " ) + timeout
                        ) ;
                    if( timeout == 0 ) {
                        clearInterval(timerId);
                        reject( false ) ;
                    }
                  }
            }, ms ) ;
        });
      }

    /**
     * 
     * @param message 
     */
    protected logger( message : string) : void {
        console.log( "%s [%s] %s", (new Date()), this.uid.split( '-' )[4], message ) ;
    } ;

    protected onClientIdle() { /* nothing to do */ } ;
    protected onClientConnected() { /* nothing to do */ } ;
    protected onClientConnectionEnd() { /* nothing to do */ } ;
    protected onClientConnectionError() { /* nothing to do */ } ;

    private initializeClient( state : ConnectionState ) {
        if( this.client ) this.client.destroy().finally() ;
        this.client = new Telnet() ;
        
        this.client.on( 'connect', () => {
            this.connectionState = 'connected' ; this.onClientConnected() ;
            //this.logger( "sockw: " + (<Socket> this.client.getSocket()).readyState ) ;
            if( this.systemConsole ) this.logger(
                 "Connected to " + this.parameters.host + ":" + this.parameters.port
                 ) ;
        }) ;
        
        this.client.on( 'end', () => {
            //this.logger( "sockw: " + (<Socket> this.client.getSocket()).readyState ) ;
            this.connectionState = 'closed' ; this.onClientConnectionEnd() ;
            if( this.systemConsole ) this.logger( 
                "End connection to " + this.parameters.host + ":" + this.parameters.port
                ) ;
            this.client.destroy().finally() ;
            this.initializeClient( null ) ;
        }) ;
        
        this.client.on( 'error', ( error: string ) => {
            switch( error ) {
                case 'Cannot connect':
                    this.connectionState = 'failedconnect' ; this.onClientConnectionError() ;
                    if( this.systemConsole ) console.error( 'Connection error while try to connect to ' + this.parameters.host + ":" + this.parameters.port) ;
                    break ;
              }
            //if( this.systemConsole ) this.logger( "Connected to " + this.paramiters.host + ":" + this.paramiters.port ) ;
        }) ;

        this.connectionState = state ; this.onClientIdle() ;
        if( this.systemConsole ) this.logger( "Client initialized..." ) ;
    } ;

    public constructor( address : string, port : number, operationsTimeout : number, lockWaitTimeout : number, systemConsole : boolean ) {
        this.uid = uuid.v4() ;
        this.systemConsole = systemConsole ;
        this.logEnabled = false ;

        this.operationsTimeout = operationsTimeout ;
        this.lockWaitTimeout = lockWaitTimeout ;

        this.requestQueue = new openpromiseLib.Queue() ;

        this.parameters.host = address ;
        this.parameters.port = port ;

        this.initializeClient( null ) ;
    }

    /**
     * 
     */
    public async connect( lock : Promise<any> ) : Promise<any> {
        var promise = new Promise<void>( (resolve, reject) => {
            if( this.connectionState == null ) {
                if( this.systemConsole ) this.logger( "Connecting to " + this.parameters.host + ":" + this.parameters.port ) ;
                this.connectionState = 'connecting' ;
                this.client.connect( this.parameters ).catch( (error: Error) => { 
                    if( "Socket ends" !== error.message ) {
                        if( this.systemConsole ) this.logger( 
                            "RESIClient:connect => " + error ) ;
                        this.initializeClient( null ) ;
                        reject( error ) ;
                    }
                    // nothing to do
                 }) ; 
                 lock.then( () => {
                    // nothing to do
                 }) ;
                 resolve() ;
            } else {
                if( this.connectionState == 'closed' ) {
                    this.initializeClient( null ) ;
                }

                this.waitFor( () => { 
                    console.log( "RESIClient:connect => " + this.connectionState ) ; return ( this.connectionState == null ) ;
                }, this.lockWaitTimeout, "RESIClient::sendcommand" )
                .then( () => { 
                    this.connect( lock ).then( resolve ).catch( reject ) ; 
                }).catch( ( error ) => {
                    if( this.systemConsole ) this.logger(
                        'RESIClient:connect => Wait for connection ready ('
                        + this.connectionState
                        + '). Failed to connect to the DALI gateway.'
                    ) ;
                    
                    reject( new Error( 'Failed to connect to the DALI gateway.' ) ) ;
                }) ;
            }
        }) ;

        return( promise ) ; 
    }

    private sendcommand( command : string ) : Promise<any> {
        var promise = new Promise<void>( (resolve, reject) => {
            //this.logger( this.connectionState ) ;
            if( this.connectionState == 'failedconnect' ) {
                if( this.systemConsole ) this.logger( 'RESIClient:sendcommand => state (' + this.connectionState + ').') ;
                reject( 'Connection failed.') ;
            } else if( this.connectionState == 'connected' ) {
                this.client.send( command, {ors: '\r', negotiationMandatory: false}, (err:any, response:any) => {
                    if( this.systemConsole ) this.logger( "RESIClient::sendcommand => " + command + " => response: " + response ) ;
                    return response ;
                }).then(( response: any ) => {
                    if( response ) resolve( response ) ; else reject( 'Response undefined') ;
                }).catch( (err: Error) => {
                    //this.logger( "Send error: " + err.message ) ;
                    //this.client.end().finally() ;
                    reject( err );
                });
            } else {
                //console.log( "RESIClient::sendcommand => connectionState : " +  this.connectionState ) ;
                this.waitFor( () => { 
                    return ( this.connectionState == 'connected' ) ; 
                }, this.lockWaitTimeout, "RESIClient::sendcommand" )
                .then( () => { 
                    this.sendcommand( command ).then( resolve ).catch( reject ) ; 
                }).catch( () => {
                    //console.log( "RESIClient::sendcommand => connectionState : " +  this.connectionState ) ;
                    this.waitFor( () => { 
                        return ( this.connectionState == null ) ; 
                    }, this.parameters.timeout, "RESIClient::sendcommand" )
                    .then( () => {
                        reject( new Error( 'Connection timeout' ) ) ;
                    }).catch( () => {
                        reject( new Error( 'Connection timeout' ) ) ;
                    })
                }) ;
            }
        });

        return( promise ) ;
    }

    /**
     * 
     * @param command 
     * @returns 
     */
    public async send( command : string ) : Promise<any> {
        var promise = new Promise<void>( (resolve, reject) => {
            var lock = new openpromiseLib.Delay( this.operationsTimeout ) ;
            var sema = new openpromiseLib.Defer() ;
            this.requestQueue.enQueue(() => {
                sema.resolve() ;
                return lock ;
            })
            
            sema.then( () => {
                //this.logger( '-----> ' + this.uid + " / " + this.connectionState ) ;
                this.connect( lock ).then( () => {
                    this.sendcommand( command ).then(( response ) => {
                        //this.logger( 'Send cmd: ' + command + " => response: " + response ) ;
                        this.client.end().finally() ;
                        lock.resolve() ;
                        resolve( response ) ;
                    }).catch(( error ) => {                        
                        lock.resolve() ;
                        reject( error ) ;
                    }) ;
                }).catch(( error ) => {
                    if( this.systemConsole ) this.logger( 'RESIClient::send(' + command + ") => " + error ) ;
                    lock.resolve() ;
                    reject( error ) ;
                }) ;
            }) ;
        }) ;

        return( promise ) ;
    }

    public isSystemConsole () : boolean {
        return this.systemConsole ;
    }
}

export interface NodeRESIClientInterface {
    isSystemConsole() : boolean ;
    getNodeStatusBroadcaster() : any ;
    send( command : string ) : Promise<any> ;

    changeStateToConnecting() : void ;
    changeStateToIdle() : void ;
    changeStateToError() : void ;
}


// export class NodeRESIClient extends RESIClient implements NodeRESIClientInterface {
//     private nodeStatusBroadcaster : any ;
//     private logEnabled : boolean = false ;

//     public constructor( address : string, port : number, operationsTimeout : number, lockWaitTimeout : number, systemConsole : boolean, logEnabled : boolean ) {
//         super( address, port, operationsTimeout, lockWaitTimeout, systemConsole ) ;

//         this.nodeStatusBroadcaster = new openpromiseLib.Cycle() ;
//         this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", text: "Idle" } ) ;
//     }

//     public getNodeStatusBroadcaster() : any { return this.nodeStatusBroadcaster } ;

//     public changeStateToConnect() {
//         if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "Connected" } ) ;
//     }
//     public changeStateToIdle() {
//         if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", text: "Idle" } ) ;
//     }
//     public changeStateToError() {
//         if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "Error" } ) ;
//     }
// }

export class NodeRESIClient implements NodeRESIClientInterface {
    private nodeStatusBroadcaster : any ;
    private resiClient : RESIClient ;

    public constructor( resiClient : RESIClient ) {
        this.resiClient = resiClient ;

        this.nodeStatusBroadcaster = new openpromiseLib.Cycle() ;

        console.log( "NodeRESIClient::constructor" ) ;
    }
    changeStateToConnecting(): void {
        if( this.nodeStatusBroadcaster ) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "Connecting" } ) ; 
    }
    changeStateToIdle(): void {
        if( this.nodeStatusBroadcaster ) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", text: "Idle" } ) ; 
    }
    changeStateToError(): void {
        if( this.nodeStatusBroadcaster ) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "Error" } ) ; 
    }
    isSystemConsole(): boolean {
        return( this.resiClient ? this.resiClient.isSystemConsole() : false ) ;
    }
    getNodeStatusBroadcaster() {
        return( this.nodeStatusBroadcaster ) ;
    }
    send(command: string): Promise<any> {
        return new Promise<any>(( resolve, reject ) => {
            this.changeStateToConnecting() ;

            this.resiClient.send( command )
                .then( ( result ) => {
                    this.changeStateToIdle() ; 
                    resolve( result ) ;
                }).catch( ( error ) => {
                    this.changeStateToError() ;
                    reject( error ) 
                });
        }) ;
        
    }
}