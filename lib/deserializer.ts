

import XMLDom from 'xmldom'


const DOMParser = XMLDom.DOMParser;


type DeserializableParam = any;


export class FaultError extends Error {
  constructor( message : string ) {
    super( message );
    this.faultCode = null;
    this.faultString = '';
  }
  faultCode: number | null;
  faultString: string;
}



/**
 * XML deserializer static class
 * @class
 */
export class Deserializer {


  /**
   * Deserialize XML to a javascript object
   * @static
   * @param {HTMLElement} xml         - The XML to parse
   * @returns {DeserializableParam[]} - Array of typed elements
   * @throws                          - If unable to parse XML
   */
  static deserialize( xml: string ): DeserializableParam[] {
    const root = new DOMParser().parseFromString( xml );
    if (! root ) throw new Error( "Failed to parse XML" );
    const dom = root.lastChild;
    if ( dom === null )
      return [];
    return this.deserializeValue( dom );
  }


  /**
   * Deserialize a value
   * @static
   * @param {ChildNode} dom           - The DOM node
   * @returns {DeserializableParam}   - Deserialized values
   */
  static deserializeValue( dom: ChildNode ): DeserializableParam {
    switch( dom.nodeName ) {
      case '#text':
        if ( dom.nextSibling != undefined )
          return this.deserializeValue( dom.nextSibling );
        else
          return '';
      case 'string':
        // Support empty string elements
        if ( dom.firstChild !== null )
          return dom.firstChild.nodeValue;
        else
          return '';
      case 'int':
      case 'i4':
      case 'i8':
        if ( dom.firstChild !== null && dom.firstChild.nodeValue !== null )
          return parseInt( dom.firstChild.nodeValue );
        else
          return '';
      case 'boolean':
        if ( dom.firstChild !== null && dom.firstChild.nodeValue !== null )
          return parseInt(dom.firstChild.nodeValue) !== 0;
        else
          return false;
      case 'double':
        if ( dom.firstChild !== null && dom.firstChild.nodeValue !== null )
          return parseFloat(dom.firstChild.nodeValue);
        else
          return '';
      case '#cdata-section':
        return dom.nodeValue;
      case 'base64':
        if ( dom.firstChild !== null && dom.firstChild.nodeValue !== null )
          return Buffer.from( dom.firstChild.nodeValue, 'base64' );
        else
          return '';
      case 'param':
      case 'value':
      case 'array':
      case 'methodResponse':
        if ( dom.firstChild !== null )
          return this.deserializeValue( dom.firstChild );
        else
          return '';
      case 'fault':
        return this.parseFault( dom );
      case 'struct':
        return this.parseStruct( dom );
      case 'member':
        return this.parseMember( dom );
      case 'data':
      case 'params':
        return this.parseParams( dom );
      case 'dateTime.iso8601':
        if ( dom.firstChild === null || dom.firstChild.nodeValue === null )
          return '';
        const str = dom.firstChild.nodeValue;
        const year = parseInt(str.substring(0,4));
        const month = parseInt(str.substring(5,7));
        const day = parseInt(str.substring(8,10));
        const time = str.substring(11).split(":");
        const hour = parseInt(time[0]);
        const min = parseInt(time[1]);
        const sec = parseInt(time[2]);
        return new Date( Date.UTC(year,month - 1,day,hour,min,sec,0) );
      default:
        throw new Error( "Unknown XML response node: " + dom.nodeName + ":'" + dom.toString() + "'" );
    }
  }


  /**
   * Parse a params structure
   * @static
   * @param {ChildNode} dom         - The DOM node
   * @returns {DeserializableParam} - Deserialized value
   */
  static parseParams( dom: ChildNode ): DeserializableParam {
    const parsed = []
    const kids = dom.childNodes;

    for ( let i = 0 ; i < kids.length ; i += 1) {
      if ( kids[ i ].nodeName == "#text" )
        continue;
      parsed.push( this.deserializeValue( kids[ i ] ) );
    }

    return parsed;
  }


  /**
   * Parse a member structure
   * @static
   * @param {ChildNode} dom         - The DOM node
   * @returns {DeserializableParam} - Deserialized value
   */
  static parseMember( dom: ChildNode ): DeserializableParam {
    const kids = dom.childNodes;
    const parsed: {[key: string]: any}={};
    let name = '';
    let value = '';
    let kid;
    for ( let i = 0 ; i < kids.length ; i += 1) {
      kid = kids[i];
      if ( kid.nodeName === 'name' && kid.firstChild !== null && kid.firstChild.nodeValue !== null )
        name = kid.firstChild.nodeValue
      if ( kid.nodeName === 'value' )
        value = this.deserializeValue( kid );
    }

    parsed[ name ] = value;
    return parsed;
  }


  /**
   * Parse a XML struct
   * @static
   * @param {ChildNode} dom         - The DOM node
   * @returns {DeserializableParam} - Object representing the struct
   */
  static parseStruct( dom: ChildNode ): DeserializableParam {
    const kids = dom.childNodes;
    let parsed;
    let struct = {}
    for ( let i = 0 ; i < kids.length ; i += 1) {
      parsed = this.deserializeValue( kids[i] )
      struct = Object.assign( struct, parsed );
    }
    return struct;
  }


  /**
   * Parse a fault
   * @static
   * @param {ChildNode} dom - The DOM node
   * @throws - In all cases throws a FaultError
   */
  static parseFault( dom: ChildNode ) {
    let err, faultObj;
    err = new FaultError( "Failed to execute method" );
    if ( dom.firstChild === null ) {
      err.faultCode = null;
      err.faultString = 'Unspecified method';
    }
    else {
      faultObj = this.deserializeValue(dom.firstChild);
      err.faultCode = faultObj.faultCode;
      err.faultString = faultObj.faultString;
    }
    throw err;
  }
}

