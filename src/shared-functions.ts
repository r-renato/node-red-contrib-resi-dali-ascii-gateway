
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