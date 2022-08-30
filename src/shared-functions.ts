import * as nodered from "node-red" ;
import { NodeExtendedInterface, RESIResponseInterface, DALICMD, RESICMD, RESIRESP, DALI_DEVICE_TYPES } from './shared-interfaces' ;

/**
 * 
 * @param obj 
 * @param currentKey 
 * @param newKey 
 * @returns 
 */
export function objectRename( obj : any, currentKey : string, newKey : string ) : any {
    if( typeof obj !== 'undefined' && currentKey !== newKey) {
        delete Object.assign(obj, {[newKey]: obj[currentKey] })[currentKey];
        return obj ; 
    } else {
        return null ;
    }
} ;

/**
 * 
 * @param ms 
 * @param promise 
 * @returns 
 */
export function requestTimeout(ms: number, promise: Promise<any> ) {
    // Create a promise that rejects in <ms> milliseconds
    let interrupt = new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id) ;
        reject( `Request timed out after + ${ms} ms.` ) ;
      }, ms)
    })
  
    // Returns a race between our timeout and the passed in promise
    return Promise.race([promise, interrupt]);
  }

  /**
   * 
   * @param p 
   * @returns 
   */
  export function promiseState(p : Promise<any>) {
    const t = {};
    return Promise.race([p, t])
      .then(v => (v === t)? "pending" : "fulfilled", () => "rejected");
  }

  export function invalidPayloadIn( msg : any ) {
    return !( msg && Object.prototype.hasOwnProperty.call( msg, 'payload' ) ) ;
  }

  /**
   * 
   * @param value 
   * @param bitPos 
   * @returns 
   */
  function isSet(value: number, bitPos: number) : boolean {
    var result = Math.floor(value / Math.pow(2, bitPos)) % 2;
    return result == 1;
 }

export function prepareDALIResponse( msg:any, response: string ) : any {
  /**
   * 
   * @param prefix 
   * @param suffix 
   * @returns 
   */
  function decodeDALIQueryStatusResp( prefix : string, suffix : string ) {
    let data = suffix.split( ',' ) ; 
    let code = <number> parseInt( data[ 0 ] ) ;
    let resp = <number> parseInt( data[ 1 ] ) ;
    let exitCode = ( RESIRESP.OK.name == prefix && code == 1) ;
    let result : any = { } ;
  
    if( exitCode ) {
      result = {
        /* Note STATUS INFORMATION: 8-bit data indicating the status of a slave.
           The meanings of the bits are as follows:
              Bit 0: Status of control gear 0=OK
              Bit 1: Lamp failure 0=OK
              Bit 2: Lamp arc power on 0=OFF 1=ON
              Bit 3: Limit Error 0=Actual level is between MIN and MAX or OFF
              Bit 4: Fade running 0=Fading is finished 1=Fading is active
              Bit 5: RESET STATE 0=OK
              Bit 6: Missing short address 0=No 1=Yes
              Bit 7: POWER FAILURE 0=No
        */
        statusControlGear : ! isSet( resp, 0 ),       // Bit 0: Status of control gear 0=OK
        lampFailure : ! isSet( resp, 1 ),             // Bit 1: Lamp failure 0=OK
        lampArcPowerOn : isSet( resp, 2 ),            // Bit 2: Lamp arc power on 0=OFF 1=ON
        queryLimitError : isSet( resp, 3 ),           // Bit 3: Limit Error 0=Actual level is between MIN and MAX or OFF
        fadeRunning : isSet( resp, 4 ),               // Bit 4: Fade running 0=Fading is finished 1=Fading is active
        queryResetState : ! isSet( resp, 5 ),         // Bit 5: RESET STATE 0=OK
        queryMissingShortAddress : isSet( resp, 6 ),  // Bit 6: Missing short address 0=No 1=Yes
        queryPowerFailure  : isSet( resp, 7 )         // Bit 7: POWER FAILURE 0=No
      } ;
    } ;
  
    result.done = ( RESIRESP.OK.name == prefix ) ;
    if( RESIRESP.OK.name == prefix && code == 9 ) 
      result.timeout = ( RESIRESP.OK.name == prefix && code == 9 ) ;
  
    return( result ) ;
  }

  function decodeDALIGroup( value : number, start : number ) {
    let result : any = {} ; let i : number = -1 ;

    i++ ; result[ 'group' + (start + i) ] = isSet( value, i ) ;
    i++ ; result[ 'group' + (start + i) ] = isSet( value, i ) ;
    i++ ; result[ 'group' + (start + i) ] = isSet( value, i ) ;
    i++ ; result[ 'group' + (start + i) ] = isSet( value, i ) ;
    i++ ; result[ 'group' + (start + i) ] = isSet( value, i ) ;
    i++ ; result[ 'group' + (start + i) ] = isSet( value, i ) ;
    i++ ; result[ 'group' + (start + i) ] = isSet( value, i ) ;
    i++ ; result[ 'group' + (start + i) ] = isSet( value, i ) ;

    console.log( "result>> " + JSON.stringify( result) ) ;
    return( result ) ;
  }

  /**
   * 
   * @param prefix 
   * @param suffix 
   * @returns 
   */
  function decodeDALIResp( prefix : string, suffix : string, attribute : string ) {
    let data = suffix.split( ',' ) ; 
    let result : any = { } ;
  
    result.done = ( RESIRESP.OK.name == prefix ) ;
  
    if( data.length > 1 ) {
      let code = <number> parseInt( data[ 0 ] ) ;
      let resp = <number> parseInt( data[ 1 ] ) ;
      
      result[ attribute ] = resp ;
  
      if( RESIRESP.OK.name == prefix && code == 9 ) 
        result.timeout = ( RESIRESP.OK.name == prefix && code == 9 ) ;
    } 
    //console.log( "decodeDALIResp: " + result ) ;
    return( result ) ;
  }

  /** 
   *  Main function
   */
  let result : any = {} ;
  let repTokenized = response.split( ':' ) ;
  // console.log( "prepareDALIResponse: " + JSON.stringify( msg ) + " / " + repTokenized
  //   + "[" + msg.payload.command + "]" 
  //   + "[" + msg.payload.action.replace(':', '') + "]" ) ;

  switch( <string> msg.payload.command ) {
    case RESICMD.LAMP.name:
      // console.log( '>>LAMP<<') ;
      switch( msg.payload.action.replace(':', '') ) {
        case DALICMD.QUERY_STATUS.name:
          result = decodeDALIQueryStatusResp( repTokenized[ 0 ], repTokenized[ 1 ] ) ;
          break ;
        case DALICMD.QUERY_DEVICE_TYPE.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'deviceType' ) ;
          result[ 'deviceTypeName' ] = DALI_DEVICE_TYPES[ result.deviceType ] ;
          break ;
        case DALICMD.QUERY_CONTROL_GEAR_PRESENT.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'isControlGearPresent' ) ;
          result.isControlGearPresent = (result.isControlGearPresent == 255) ;
          break;
        case DALICMD.QUERY_ACTUAL_LEVEL.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'actualLampLevel' ) ;
          break ;
        case DALICMD.QUERY_POWER_ON_LEVEL.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'powerOnLevel' ) ;
          break ;
        case DALICMD.QUERY_SYSTEM_FAILURE_LEVEL.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'systemFailureLevel' ) ;
          break;
        case DALICMD.QUERY_FADE_TIME_FADE_RATE.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'fadeTimeFadeRate' ) ;
          break ;
        case DALICMD.QUERY_PHYSICAL_MINIMUM.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'physicalMinimumLevel' ) ;
          break ;
        case DALICMD.QUERY_MIN_LEVEL.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'minLevel' ) ;
          break ;
        case DALICMD.QUERY_MAX_LEVEL.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'maxLevel' ) ;
          break ;
        case DALICMD.QUERY_GROUPS_0_7.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'groups' ) ;
          result.groups = decodeDALIGroup( result.groups, 0 ) ;
          break;
        case DALICMD.QUERY_GROUPS_8_15.name:
          result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ], 'groups' ) ;
          result.groups = decodeDALIGroup( result.groups, 8 ) ;
          break
      }
      break ;
    case RESICMD.LAMP_QUERY_RGBWAF.name:
      console.log( 'msg for: ' + RESICMD.LAMP_QUERY_RGBWAF.name ) ;
      if( '#LQRGBWAF' == repTokenized[ 0 ] ) {
        if( 'ERR' == repTokenized[ 1 ] ) {
          result.timeout = true ;
          console.log( 'msg for: ' + RESICMD.LAMP_QUERY_RGBWAF.name + " / Error") ;
        } else {
          let data = repTokenized[ 1 ].split( ',' ) ;
          console.log( 'msg for: ' + RESICMD.LAMP_QUERY_RGBWAF.name + " / " + data.length) ;
          if( data.length == 8 ) {
            result.done = true ;
            result.lamp = parseInt( data[ 0 ] ) ;
            result.arcPowerLevel = parseInt( data[ 1 ] ) ;
            result.color = {
              red : parseInt( data[ 2 ] ),
              green : parseInt( data[ 3 ] ),
              blu : parseInt( data[ 4 ] ),
              white : parseInt( data[ 5 ] ),
              amber : parseInt( data[ 6 ] ),
              freeColor : parseInt( data[ 7 ] )
            }
          }
        }
      }
      console.log( 'msg for: ' + RESICMD.LAMP_QUERY_RGBWAF.name + " / " + JSON.stringify( result ) ) ;
      break ;
    default:
      // console.log( '>>default<<') ;
      result.done = ( RESIRESP.OK.name == repTokenized[ 0 ])
      break ;
  }
//    console.log( JSON.stringify( result ) )
  return( result ) ;
}

/**
 * 
 * @param nodeClient 
 * @param textCommand 
 * @param msg 
 * @returns Promise<nodered.NodeMessage>
 */
 export function executeDALICommand( nodeClient : NodeExtendedInterface, textCommand : string, msg : any ) : Promise<nodered.NodeMessage> {
  return new Promise( ( resolve, reject ) => {
      if( nodeClient.connection.isSystemConsole() ) nodeClient.log( "Try to sending command: " + textCommand ) ;

      nodeClient.connection.changeStateToConnect() ;
      nodeClient.connection.send( textCommand ).then( ( response ) => {
          //console.log( ">>> " + JSON.stringify( response ) ) ;
          
          var result = <RESIResponseInterface> Object.assign({}, msg)
          result = objectRename( result, 'payload', 'daliRequest' ) ;
          result.payload = prepareDALIResponse( msg, response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ) ;
          result.payload.raw = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
          //result.payload = response.replace(/\s/g, '').replace(/[\r\n]/gm, '') ;
          
          nodeClient.connection.changeStateToIdle() ;
          resolve( <nodered.NodeMessage> result ) ;
      }).catch( ( error ) => {
          nodeClient.connection.changeStateToError() ;
          reject( error ) ;
      }) ;
  }) ;
}

/**
 * 
 * @param msg 
 * @param command 
 * @param action 
 * @returns 
 */
export function buildRequestNodeMessage( msg : any, command : string, action: string ) : any {
  let newMsg =  Object.assign({}, msg) ; newMsg.payload = {} ;
  newMsg.payload.command = command ; newMsg.payload.action = action ; newMsg.payload.params = ':' + msg.payload.lamp ;
  return( newMsg ) ;
}