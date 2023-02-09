

import XMLDom from 'xmldom'


const DOMParser = XMLDom.DOMParser;


/**
 * XML deserializer static class
 * @class
 */
export default class Deserializer {


  /**
   * Deserialize XML to a javascript object
   * @static
   * @param {String} xml  - The XML to parse
   * @returns {Array}     - Array of typed elements
   * @throws              - If unable to parse XML
   */
  static deserialize( xml ) {
    const root = new DOMParser().parseFromString( xml );
    if (! root ) throw new Error( "Failed to parse XML" );
    const dom = root.lastChild;
    return this.deserializeValue( dom );
  }


  /**
   * Deserialize a value
   * @static
   * @param {Object} dom - The DOM node
   */
  static deserializeValue( dom ) {
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
        return parseInt(dom.firstChild.nodeValue);
      case 'boolean':
        return parseInt(dom.firstChild.nodeValue) != 0;
      case 'double':
        return parseFloat(dom.firstChild.nodeValue);
      case '#cdata-section':
        return dom.nodeValue;
      case 'param':
      case 'value':
      case 'methodResponse':
        return this.deserializeValue( dom.firstChild );
      case 'fault':
        return this.parseFault( dom );
      case 'struct':
        return this.parseStruct( dom );
      case 'member':
        return this.parseMember( dom );
      case 'array':
        return this.deserializeValue( dom.firstChild );
      case 'data':
      case 'params':
        return this.parseParams( dom );
      case 'dateTime.iso8601':
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
   * @param {Object} dom - The DOM node
   */
  static parseParams( dom ) {
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
   * @param {Object} dom - The DOM node
   */
  static parseMember( dom ) {
    const kids = dom.childNodes;
    const parsed = {};
    let name = '';
    let value = '';
    let kid;
    for ( let i = 0 ; i < kids.length ; i += 1) {
      kid = kids[i];
      if ( kid.nodeName === 'name' )
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
   * @param {Object} dom  - The DOM node
   * @returns {Object}    - Object representing the struct
   */
  static parseStruct( dom ) {
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
   * @param {Object} dom - The DOM node
   */
  static parseFault( node ) {
    const parsed = this.deserializeValue( node.firstChild );
    throw new Error( "Failed to execute method: " + JSON.stringify( parsed ) );
  }
}

