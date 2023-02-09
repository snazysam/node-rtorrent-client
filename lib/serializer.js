
import XMLDom from 'xmldom';


const DOMParser = XMLDom.DOMParser;


/**
 * XML serializing utility static class
 * @class
 */
export default class Serializer {


  /** 
   * Serialize a request method and parameters to XML
   * @static
   * @param {String} method - The method to call
   * @param {*[]} params    - Parameters for the call
   * @returns {String}      - The serialized XML
   */
  static serialize( method, params ) {
    const template = '<?xml version="1.0"?><methodCall><methodName></methodName><params></params></methodCall></xml>';
    const doc = new DOMParser().parseFromString(template);
    const dom_methodName = doc.getElementsByTagName('methodName')[0];
    const dom_params = doc.getElementsByTagName('params')[0];
    let dom_param;

    dom_methodName.appendChild( doc.createTextNode( method ) );

    for ( let i = 0 ; i < params.length ; i += 1 ) {
      dom_param = doc.createElement('param');
      this.serializeValue(dom_param, params[i])
      dom_params.appendChild(dom_param)
    }
    return doc.toString();
  }


  /**
   * Serialize a value into the XML fragment
   * @static
   * @param {Object} fragment - DOM fragment
   * @param {*[]} param       - Parameter to serialize
   */
  static serializeValue( fragment, param ) {
    const type = typeof param;
    const doc = fragment.ownerDocument;
    const dom = doc.createElement('value');

    if ( type == "string" )
      this.buildString( dom, param );
    else if ( type == "number" )
      this.buildNumber( dom, param );
    else if ( Array.isArray( param ) )
      this.buildArray( dom, param );
    else if ( param instanceof Date )
      this.buildDate( dom, param );
    else if ( Buffer.isBuffer( param ) )
      this.buildData( dom, param );
    else if ( type == "object" )
      this.buildObject( dom, param );

    fragment.appendChild(dom)
  }


  /** 
   * Serialize a string into a XML fragment
   * @static
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {String} param    - A string to serialize
   */
  static buildString( fragment, param ) {
    const doc = fragment.ownerDocument;
    const elem = doc.createElement('string');

    // Support URLs and such
    if ( ! param.match( /^(?![^<&]*]]>[^<&]*)[^<&]*$/ ) )
      this.buildData( elem, param );
    else
      elem.appendChild( doc.createTextNode( param ) );

    fragment.appendChild( elem );
  }


  /**
   * Serialize character data
   * @static
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {String} param    - A string to serialize
   */
  static buildData( fragment, param ) {
    const doc = fragment.ownerDocument;
    const elem = doc.createCDATASection( param );
    fragment.appendChild( elem );
  }


  /**
   * Serialize a number
   * @static
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {Number} param    - A string to serialize
   */
  static buildNumber( fragment, param ) {
    const doc = fragment.ownerDocument;
    let elem;

    if ( param % 1 == 0 )
      elem = doc.createElement( 'int' );
    else
      elem = doc.createElement( 'double' );

    elem.appendChild( doc.createTextNode( param ) );
    fragment.appendChild( elem );
  }


  /**
   * Serialize a date
   * @static
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {Date} param      - A string to serialize
   */
  static buildDate( fragment, param ) {
    const doc = fragment.ownerDocument;
    const elem = doc.createElement('dateTime.iso8601');
    elem.appendChild( doc.createTextNode( param.toISOString() ) );
    fragment.appendChild(elem);
  }


  /**
   * Serialize an array
   * @static
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {Array} param     - An array to serialize
   */
  static buildArray( fragment, param ) {
    const doc = fragment.ownerDocument;
    const elem = doc.createElement('array');
    const data = doc.createElement('data');

    // Recursively serialize
    for ( let i = 0 ; i < param.length ; i += 1 )
      this.serializeValue( data, param[i] );

    elem.appendChild(data);
    fragment.appendChild(elem);
  }


  /**
   * Serialize an object
   * @static
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {Object} param    - An object to serialize
   */
  static buildObject( fragment, param ) {
    const doc = fragment.ownerDocument;
    const elem = doc.createElement('struct');
    let elem_member, elem_name;

    for (const key in param) {
      elem_member = doc.createElement('member');
      elem_name = doc.createElement('name');

      elem_name.appendChild( doc.createTextNode( key ) );
      elem_member.appendChild( elem_name );

      this.serializeValue( elem_member, param[ key ] );
      elem.appendChild( elem_member );
    }
    fragment.appendChild(elem);
  }

}


