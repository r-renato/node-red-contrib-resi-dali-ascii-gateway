
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

  function decodeDALIQueryStatusResp() {

  }
  
  export function prepareDALIResponse( msg:any, response: string ) : any {
    let repTokenized = response.split( ':' ) ;
    console.log( repTokenized ) ;

    switch( msg.payload.command ) {
      case 'LAMP':
        switch( msg.payload.action ) {


        }
        break ;
    }

    return ;
  }