
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

  function isSet(value: number, bitPos: number) : boolean {
    var result = Math.floor(value / Math.pow(2, bitPos)) % 2;
    return result == 1;
 }

function decodeDALIResp( prefix : string, suffix : string ) {
  let data = suffix.split( ',' ) ; 
  let result : any = { } ;

  result.done = ( "#OK" == prefix ) ;

  if( data.length > 1 ) {
    let code = <number> parseInt( data[ 0 ] ) ;
    let resp = <number> parseInt( data[ 1 ] ) ;
    
    result.value = resp ;

    if( "#OK" == prefix && code == 9 ) 
      result.timeout = ( "#OK" == prefix && code == 9 ) ;
  } 

  return( result ) ;
}

function decodeDALIQueryStatusResp( prefix : string, suffix : string ) {
  let data = suffix.split( ',' ) ; 
  let code = <number> parseInt( data[ 0 ] ) ;
  let resp = <number> parseInt( data[ 1 ] ) ;
  let exitCode = ( "#OK" == prefix && code == 1) ;
  let result : any = { } ;

  if( exitCode ) {
    result = {
      /* Note STATUS INFORMATION: 8-bit data indicating the status of a slave.
          The meanings of the bits are as follows:
          bit 0 Status of control gear :<0>=OK 
          bit 1 Lamp failure :<0>=OK
          bit 2 Lamp arc power on :<0>=OFF
          bit 3 Query Limit Error :<0>=No
          bit 4 Fade running:<0>=fade is ready, <1>=fade is running
          bit 5 Query RESET STATE :<0>=No
          bit 6 Query Missing short address :<0>=No
          bit 7 Query POWER FAILURE :<0>=No
        */

      statusControlGear : isSet( resp, 0 ),
      lampFailure : isSet( resp, 1 ),
      lampArcPowerOn : isSet( resp, 2 ),
      queryLimitError : isSet( resp, 3 ),
      fadeRunning : isSet( resp, 4 ),
      queryResetState : isSet( resp, 5 ),
      queryMissingShortAddress : isSet( resp, 6 ),
      queryPowerFailure  : isSet( resp, 7 )
    } ;
  } ;

  result.done = ( "#OK" == prefix ) ;
  if( "#OK" == prefix && code == 9 ) 
    result.timeout = ( "#OK" == prefix && code == 9 ) ;

  return( result ) ;
}

  export function prepareDALIResponse( msg:any, response: string ) : any {
    let result : any = {} ;
    let repTokenized = response.split( ':' ) ;
//    console.log( JSON.stringify( msg ) + " / " + repTokenized ) ;

    switch( msg.payload.command ) {
      case 'LAMP':
        switch( msg.payload.action ) {
          case 'QUERY STATUS':
            result = decodeDALIQueryStatusResp( repTokenized[ 0 ], repTokenized[ 1 ] ) ;
            break ;
          case 'QUERY ACTUAL LEVEL':
            result = decodeDALIResp( repTokenized[ 0 ], repTokenized[ 1 ] ) ;
            break ;
        }
        break ;
      default:
        result.done = ( "#OK" == repTokenized[ 0 ])
        break ;
    }
//    console.log( JSON.stringify( result ) )
    return( result ) ;
  }
