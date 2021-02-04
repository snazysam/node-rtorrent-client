

import XMLDom from 'xmldom'


const DOMParser = XMLDom.DOMParser;


class Deserializer {

  constructor() {
  }


  /**
   * Deserialize XML to a javascript object
   * @param {String} xml - The XML to parse
   */
  deserialize( xml ) {
    var root = new DOMParser().parseFromString( xml );
    if (! root )
      throw new Error( "Failed to parse XML" );

    var dom = root.lastChild;

    return this.deserializeValue( dom );
  }


  /**
   * Deserialize a value
   * @param {Object} dom - The DOM node
   */
  deserializeValue( dom ) {

    var kids;

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
      case 'base64':
        return new Buffer(dom.firstChild.nodeValue, 'base64').toString();
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
        var str = dom.firstChild.nodeValue;
        var year = parseInt(str.substring(0,4));
        var month = parseInt(str.substring(5,7));
        var day = parseInt(str.substring(8,10));
        var time = str.substring(11).split(":");
        var hour = parseInt(time[0]);
        var min = parseInt(time[1]);
        var sec = parseInt(time[2]);
        return new Date( Date.UTC(year,month - 1,day,hour,min,sec,0) );
      default: 
        throw new Error( "Unknown XML response node: " + dom.nodeName + ":'" + dom.toString() + "'" );
    }
  }


  /**
   * Parse a params structure
   */
  parseParams( dom ) {
    var parsed = []
    var kids = dom.childNodes;

    for ( var i = 0 ; i < kids.length ; i += 1) {
      if ( kids[ i ].nodeName == "#text" )
        continue;
      parsed.push( this.deserializeValue( kids[ i ] ) );
    }

    return parsed;

  }


  /**
   * Parse a member structure
   */
  parseMember( dom ) {
    var name = '';
    var value = '';
    var parsed = {};
    var kids = dom.childNodes;
    for ( var i = 0 ; i < kids.length ; i += 1) {
      var kid = kids[i];
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
   * @param {Object} dom - The DOM node
   */
  parseStruct( dom ) {
    var kids = dom.childNodes;
    var parsed;
    var struct = {}

    for ( var i = 0 ; i < kids.length ; i += 1) {
      parsed = this.deserializeValue( kids[i] )
      struct = Object.assign( struct, parsed );
    }
    return struct;
  }



  /**
   * Parse a fault 
   * @param {Object} dom - The DOM node
   */
  parseFault( node ) {
    var parsed = this.deserializeValue( node.firstChild );
    throw new Error( "Failed to execute method: " + JSON.stringify( parsed ) );
  }
}

export default Deserializer;

