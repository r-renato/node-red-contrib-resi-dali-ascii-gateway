import * as nodered from "node-red" ;
import { NodeExtendedInterface, TelnetEngineInterface } from './shared-interfaces' ;

const uuid = require( 'uuid' ) ;
const openpromiseLib = require( 'openpromise' ) ;
const { Telnet } = require('telnet-client') ;

type ConnectionState = null | 'closed' | 'connected' | 'failedconnect'  ;

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

    private client : any ;
    private paramiters : { host : string, port : number, timeout : number } =  { 
        host : '', port : -1, timeout : 1000
    } ;

    private connectionState : ConnectionState = null ;

    private requestQueue : any ;

    /**
     * 
     * @param test 
     * @param ms 
     * @returns 
     */
    protected async waitFor( test : () => boolean, ms : number ) : Promise<any> {
        return new Promise( ( resolve, reject ) => {
            let timeout = 3 ;
            let timerId = setInterval( () => {
                if( test() ) {
                    clearInterval(timerId);
                    resolve( true ) ;
                  } else {
                    timeout-- ; 
                    if( this.systemConsole ) this.logger( "waitFor timeout: " + timeout ) ;
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

    private initializeClient() {
        console.log( "--- initializeClient " + (this.client ? true : false ) ) ;
        if( this.client ) this.client.destroy().finally() ;
        this.client = new Telnet() ;
        console.log( "--- initializeClient 1" ) ;
        this.client.on( 'connect', () => {
            this.connectionState = 'connected' ; this.onClientConnected() ;
            //this.logger( "sockw: " + (<Socket> this.client.getSocket()).readyState ) ;
            if( this.systemConsole ) this.logger(
                 "Connected to " + this.paramiters.host + ":" + this.paramiters.port
                 ) ;
        }) ;
        console.log( "--- initializeClient 2" ) ;
        this.client.on( 'end', () => {
            //this.logger( "sockw: " + (<Socket> this.client.getSocket()).readyState ) ;
            this.connectionState = 'closed' ; this.onClientConnectionEnd() ;
            if( this.systemConsole ) this.logger( 
                "End connection to " + this.paramiters.host + ":" + this.paramiters.port
                ) ;
            this.client.destroy().finally() ;
            this.initializeClient() ;
        }) ;
        console.log( "--- initializeClient 3" ) ;
        this.client.on( 'error', ( error: string ) => {
            switch( error ) {
                case 'Cannot connect':
                    this.connectionState = 'failedconnect' ; this.onClientConnectionError() ;
                    if( this.systemConsole ) console.error( 'Connection error while try to connect to ' + this.paramiters.host + ":" + this.paramiters.port ) ;
                    break ;
              }
            //if( this.systemConsole ) this.logger( "Connected to " + this.paramiters.host + ":" + this.paramiters.port ) ;
        }) ;

        console.log( "--- initializeClient 4" ) ;
        this.connectionState = null ; this.onClientIdle() ;
        console.log( "--- initializeClient 5" ) ;
        if( this.systemConsole ) this.logger( "Client initialized..." ) ;
        console.log( "--- initializeClient 6" ) ;
    } ;

    public constructor( address : string, port : number, systemConsole : boolean ) {
        console.log( "-------- in " ) ;
        this.uid = uuid.v4() ;
        this.systemConsole = systemConsole ;

        this.requestQueue = new openpromiseLib.Queue() ;

        this.paramiters.host = address ;
        this.paramiters.port = port ;

        this.initializeClient() ;
        console.log( "-------- out " ) ;
    }

    /**
     * 
     */
    public async connect( lock : Promise<any> ) : Promise<any> {
        var promise = new Promise<void>( (resolve, reject) => {
            if( this.connectionState == null ) {
                if( this.systemConsole ) this.logger( "Connecting to " + this.paramiters.host + ":" + this.paramiters.port ) ;
                this.client.connect( this.paramiters ).catch( (error: Error) => { 
                    // nothing to do
                 }) ; 
                 lock.then( () => {
                    // nothing to do
                 }) ;
                 resolve() ;
            } else {
                if( this.connectionState == 'closed' ) {
                    this.initializeClient() ;
                    this.connectionState = null ;
                }

                this.waitFor( () => { console.log( this.connectionState ) ; return ( this.connectionState == null ) ; }, 200 )
                .then( () => { 
                    this.connect( lock ).then( resolve ).catch( reject ) ; 
                }).catch( () => {
                    this.logger( '-- connection failed --')
                }) ;
            }
        }) ;

        return( promise ) ; 
    }

    private sendcommand( command : string ) : Promise<any> {
        var promise = new Promise<void>( (resolve, reject) => {
            //this.logger( this.connectionState ) ;
            if( this.connectionState == 'failedconnect' ) {
                this.logger( 'failed')
                reject() ;
            } else if( this.connectionState == 'connected' ) {
                this.client.send( command, {ors: '\r', negotiationMandatory: false}, (err:any, response:any) => {
                    if( this.systemConsole ) this.logger( "commad: " + command + " => response: " + response ) ;
                    return response ;
                }).then(( response: any ) => {
                    resolve( response );
                }).catch( (err: Error) => {
                    //this.logger( "Send error: " + err.message ) ;
                    //this.client.end().finally() ;
                    reject( err );
                });
            } else {
                this.waitFor( () => { return ( this.connectionState == 'connected' ) ; }, 200 )
                .then( () => { 
                    this.sendcommand( command ).then( resolve ).catch( reject ) ; 
                }).catch( () => {
                    reject( new Error( 'Connection timeout' ) ) ;
                }) ;
            }
        });

        return( promise ) ;
    }

    public async send( command : string ) : Promise<any> {
        var promise = new Promise<void>( (resolve, reject) => {
            var lock = new openpromiseLib.Delay( 60000 ) ;
            var sema = new openpromiseLib.Defer() ;
            this.requestQueue.enQueue(() => {
                sema.resolve() ;
                return lock ;
            })
            
            sema.then( () => {
                //this.logger( '-----> ' + this.uid + " / " + this.connectionState ) ;
                this.connect( lock ).then(() => {
                    this.sendcommand( command ).then(( response ) => {
                        //this.logger( 'Send cmd: ' + command + " => response: " + response ) ;
                        this.client.end().finally() ;
                        lock.resolve() ;
                        resolve( response ) ;
                    }).catch(( error ) => {
                        this.client.end().finally() ;
                        lock.resolve() ;
                        reject( error ) ;
                    }) ;
                }).catch(( error ) => {
                    this.logger( 'Send cmd: ' + command + " => erro: " + error ) ;
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
    isSystemConsole () : boolean ;
    getNodeStatusBroadcaster() : any ;
    send( command : string ) : Promise<any> ;
}


export class NodeRESIClient extends RESIClient implements NodeRESIClientInterface{
    private nodeStatusBroadcaster : any ;

    public constructor( address : string, port : number, nodeConnection : nodered.Node, systemConsole : boolean ) {
        super( address, port, systemConsole ) ;

        this.nodeStatusBroadcaster = new openpromiseLib.Cycle() ;
    }

    public getNodeStatusBroadcaster() : any { return this.nodeStatusBroadcaster } ;

    protected onClientConnect(): void {
        if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "Connected" } ) ;
    }
    protected onClientIdle() { 
        if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", text: "Idle" } ) ; 
    } ;
    protected onClientConnected() { 
        if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "Connected" } ) ;
    } ;
    protected onClientConnectionEnd() {
        if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", text: "Closed" } ) ;
    } ;
    protected onClientConnectionError() {
        if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "Connection error" } ) ;
    } ;
}