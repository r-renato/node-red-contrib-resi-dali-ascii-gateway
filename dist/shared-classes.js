"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeRESIClient = exports.RESIClient = exports.Status = void 0;
const uuid = require('uuid');
const openpromiseLib = require('openpromise');
const { Telnet } = require('telnet-client');
class Status {
    constructor(node, nodeServer) {
        this.statusBroadcasting = null;
        this.statusResetter = null;
        this.statusVal = { fill: "grey", shape: "ring", text: "idle" };
        this.setStatus = (state) => {
            this.statusVal = { fill: "grey", shape: "ring", text: "idle" };
            clearTimeout(this.statusResetter);
            if (state) {
                this.statusVal['shape'] = "dot";
                this.statusResetter = setTimeout(() => { this.setStatus(false); }, 500);
            }
            else {
                this.statusVal['shape'] = "ring";
            }
            this.node.status(this.statusVal);
        };
        this.getStatus = () => {
            return (this.statusVal);
        };
        this.getStatusBroadcasting = () => {
            return (this.statusBroadcasting);
        };
        this.node = node;
        this.statusSender = nodeServer.getStatusBroadcaster();
        this.statusBroadcasting = this.statusSender.thenAgain((st) => {
            this.statusVal = Object.assign(this.statusVal, st);
            node.status(this.statusVal);
        });
    }
    ;
}
exports.Status = Status;
;
/**
 *
 */
class RESIClient {
    constructor(address, port, operationsTimeout, lockWaitTimeout, systemConsole) {
        this.paramiters = {
            host: '', port: -1, timeout: 1000
        };
        this.operationsTimeout = 60000;
        this.lockWaitTimeout = 200;
        this.connectionState = null;
        this.uid = uuid.v4();
        this.systemConsole = systemConsole;
        //this.logEnabled = logEnabled ;
        this.operationsTimeout = operationsTimeout;
        this.lockWaitTimeout = lockWaitTimeout;
        this.requestQueue = new openpromiseLib.Queue();
        this.paramiters.host = address;
        this.paramiters.port = port;
        this.initializeClient();
    }
    /**
     *
     * @param test
     * @param ms
     * @returns
     */
    waitFor(test, ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let timeout = 3;
                let timerId = setInterval(() => {
                    if (test()) {
                        clearInterval(timerId);
                        resolve(true);
                    }
                    else {
                        timeout--;
                        if (this.systemConsole)
                            this.logger("waitFor timeout: " + timeout);
                        if (timeout == 0) {
                            clearInterval(timerId);
                            reject(false);
                        }
                    }
                }, ms);
            });
        });
    }
    /**
     *
     * @param message
     */
    logger(message) {
        console.log("%s [%s] %s", (new Date()), this.uid.split('-')[4], message);
    }
    ;
    onClientIdle() { }
    ;
    onClientConnected() { }
    ;
    onClientConnectionEnd() { }
    ;
    onClientConnectionError() { }
    ;
    initializeClient() {
        if (this.client)
            this.client.destroy().finally();
        this.client = new Telnet();
        this.client.on('connect', () => {
            this.connectionState = 'connected';
            this.onClientConnected();
            //this.logger( "sockw: " + (<Socket> this.client.getSocket()).readyState ) ;
            if (this.systemConsole)
                this.logger("Connected to " + this.paramiters.host + ":" + this.paramiters.port);
        });
        this.client.on('end', () => {
            //this.logger( "sockw: " + (<Socket> this.client.getSocket()).readyState ) ;
            this.connectionState = 'closed';
            this.onClientConnectionEnd();
            if (this.systemConsole)
                this.logger("End connection to " + this.paramiters.host + ":" + this.paramiters.port);
            this.client.destroy().finally();
            this.initializeClient();
        });
        this.client.on('error', (error) => {
            switch (error) {
                case 'Cannot connect':
                    this.connectionState = 'failedconnect';
                    this.onClientConnectionError();
                    if (this.systemConsole)
                        console.error('Connection error while try to connect to ' + this.paramiters.host + ":" + this.paramiters.port);
                    break;
            }
            //if( this.systemConsole ) this.logger( "Connected to " + this.paramiters.host + ":" + this.paramiters.port ) ;
        });
        this.connectionState = null;
        this.onClientIdle();
        if (this.systemConsole)
            this.logger("Client initialized...");
    }
    ;
    /**
     *
     */
    connect(lock) {
        return __awaiter(this, void 0, void 0, function* () {
            var promise = new Promise((resolve, reject) => {
                if (this.connectionState == null) {
                    if (this.systemConsole)
                        this.logger("Connecting to " + this.paramiters.host + ":" + this.paramiters.port);
                    this.client.connect(this.paramiters).catch((error) => {
                        // nothing to do
                    });
                    lock.then(() => {
                        // nothing to do
                    });
                    resolve();
                }
                else {
                    if (this.connectionState == 'closed') {
                        this.initializeClient();
                        this.connectionState = null;
                    }
                    this.waitFor(() => { console.log(this.connectionState); return (this.connectionState == null); }, this.lockWaitTimeout)
                        .then(() => {
                        this.connect(lock).then(resolve).catch(reject);
                    }).catch(() => {
                        this.logger('-- connection failed --');
                    });
                }
            });
            return (promise);
        });
    }
    sendcommand(command) {
        var promise = new Promise((resolve, reject) => {
            //this.logger( this.connectionState ) ;
            if (this.connectionState == 'failedconnect') {
                this.logger('failed');
                reject();
            }
            else if (this.connectionState == 'connected') {
                this.client.send(command, { ors: '\r', negotiationMandatory: false }, (err, response) => {
                    if (this.systemConsole)
                        this.logger("dali client :: sendcommand - " + command + " => response: " + response);
                    return response;
                }).then((response) => {
                    resolve(response);
                }).catch((err) => {
                    //this.logger( "Send error: " + err.message ) ;
                    //this.client.end().finally() ;
                    reject(err);
                });
            }
            else {
                this.waitFor(() => { return (this.connectionState == 'connected'); }, this.lockWaitTimeout)
                    .then(() => {
                    this.sendcommand(command).then(resolve).catch(reject);
                }).catch(() => {
                    reject(new Error('Connection timeout'));
                });
            }
        });
        return (promise);
    }
    send(command) {
        return __awaiter(this, void 0, void 0, function* () {
            var promise = new Promise((resolve, reject) => {
                var lock = new openpromiseLib.Delay(this.operationsTimeout);
                var sema = new openpromiseLib.Defer();
                this.requestQueue.enQueue(() => {
                    sema.resolve();
                    return lock;
                });
                sema.then(() => {
                    //this.logger( '-----> ' + this.uid + " / " + this.connectionState ) ;
                    this.connect(lock).then(() => {
                        this.sendcommand(command).then((response) => {
                            //this.logger( 'Send cmd: ' + command + " => response: " + response ) ;
                            this.client.end().finally();
                            lock.resolve();
                            resolve(response);
                        }).catch((error) => {
                            if (this.client)
                                this.client.end().finally();
                            lock.resolve();
                            reject(error);
                        });
                    }).catch((error) => {
                        this.logger('Send cmd: ' + command + " => erro: " + error);
                        reject(error);
                    });
                });
            });
            return (promise);
        });
    }
    isSystemConsole() {
        return this.systemConsole;
    }
}
exports.RESIClient = RESIClient;
class NodeRESIClient extends RESIClient {
    constructor(address, port, operationsTimeout, lockWaitTimeout, systemConsole, logEnabled) {
        super(address, port, operationsTimeout, lockWaitTimeout, systemConsole);
        this.logEnabled = false;
        this.nodeStatusBroadcaster = new openpromiseLib.Cycle();
        this.nodeStatusBroadcaster.repeat({ fill: "grey", text: "Idle" });
    }
    getNodeStatusBroadcaster() { return this.nodeStatusBroadcaster; }
    ;
    changeStateToConnect() {
        if (this.nodeStatusBroadcaster)
            this.nodeStatusBroadcaster.repeat({ fill: "green", text: "Connected" });
    }
    changeStateToIdle() {
        if (this.nodeStatusBroadcaster)
            this.nodeStatusBroadcaster.repeat({ fill: "grey", text: "Idle" });
    }
    changeStateToError() {
        if (this.nodeStatusBroadcaster)
            this.nodeStatusBroadcaster.repeat({ fill: "red", text: "Error" });
    }
}
exports.NodeRESIClient = NodeRESIClient;
// export class NodeRESIClient implements NodeRESIClientInterface {
//     private nodeStatusBroadcaster : any ;
//     private resiClient : RESIClient ;
//     public constructor( resiClient : RESIClient ) {
//         this.resiClient = resiClient ;
//         this.nodeStatusBroadcaster = new openpromiseLib.Cycle() ;
//     }
//     isSystemConsole(): boolean {
//         return( this.resiClient.isSystemConsole() ) ;
//     }
//     getNodeStatusBroadcaster() {
//         return( this.nodeStatusBroadcaster ) ;
//     }
//     send(command: string): Promise<any> {
//         return new Promise<any>(( resolve, reject ) => {
//             if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "green", text: "Connected" } ) ;
//             this.resiClient.send( command )
//                 .then( ( result ) => {
//                     if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", text: "Idle" } ) ; 
//                     resolve( result ) ;
//                 }).catch( ( error ) => {
//                     if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "red", text: "Error" } ) ;
//                     reject( error ) 
//                 });
//         }) ;
//         if( this.nodeStatusBroadcaster) this.nodeStatusBroadcaster.repeat( <nodered.NodeStatus> { fill: "grey", text: "Idle" } ) ; 
//     }
//# sourceMappingURL=shared-classes.js.map