
import XMLDom from 'xmldom';

const DOMParser = XMLDom.DOMParser;


type SerializableParam = any;

/**
 * XML serializing utility static class
 * @class
 */
export default class Serializer {


  /** 
   * Serialize a request method and parameters to XML
   * @static
   * @param {String} method               - The method to call
   * @param {SerializableParam[]} params  - Parameters for the call
   * @returns {String}                    - The serialized XML
   */
  static serialize( method: string, params: SerializableParam[] ): string {
    const template = '<?xml version="1.0"?><methodCall><methodName></methodName><params></params></methodCall></xml>';
    const doc = new DOMParser().parseFromString(template);
    const dom_methodName = doc.getElementsByTagName('methodName')[0];
    const dom_params = doc.getElementsByTagName('params')[0];
    let dom_param: HTMLElement;

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
   * @param {HTMLElement} fragment    - DOM fragment
   * @param {SerializableParam} param - Parameter to serialize
   */
  static serializeValue( fragment: HTMLElement, param: SerializableParam ) {
    const type = typeof param;
    const doc = fragment.ownerDocument;
    const dom = doc.createElement('value');

    if ( type == "string" )
      this.buildString( dom, param as string );
    else if ( type == "number" )
      this.buildNumber( dom, param as number );
    else if ( Array.isArray( param ) )
      this.buildArray( dom, param );
    else if ( param instanceof Date )
      this.buildDate( dom, param as Date );
    else if ( Buffer.isBuffer( param ) )
      this.buildData( dom, param as Buffer );
    else if ( type == "object" )
      this.buildObject( dom, param );

    fragment.appendChild(dom)
  }


  /** 
   * Serialize a string into a XML fragment
   * @static
   * @param {HTMLElement} fragment  - DOM fragment to serialize into
   * @param {String} param       - A string to serialize
   */
  static buildString( fragment: HTMLElement, param: string ) {
    const doc = fragment.ownerDocument;
    let elem;

    // Support URLs and such
    if ( ! param.match( /^(?![^<&]*]]>[^<&]*)[^<&]*$/ ) ) {
      elem = doc.createElement('string');
      elem.appendChild( doc.createCDATASection( param ) );
    }
    else {
      elem = doc.createElement('string');
      elem.appendChild( doc.createTextNode( param ) );
    }

    fragment.appendChild( elem );
  }


  /**
   * Serialize character data
   * @static
   * @param {HTMLElement} fragment  - DOM fragment to serialize into
   * @param {Buffer} param          - A string to serialize
   */
  static buildData( fragment: HTMLElement, param: Buffer ) {
    const doc = fragment.ownerDocument;
    const elem = doc.createElement( 'base64' );

    elem.appendChild( doc.createTextNode( param.toString( 'base64' ) ) );
    fragment.appendChild( elem );
  }


  /**
   * Serialize a number
   * @static
   * @param {HTMLElement} fragment - DOM fragment to serialize into
   * @param {Number} param    - A string to serialize
   */
  static buildNumber( fragment: HTMLElement, param: number ) {
    const doc = fragment.ownerDocument;
    let elem;

    if ( param % 1 == 0 )
      elem = doc.createElement( 'int' );
    else
      elem = doc.createElement( 'double' );

    elem.appendChild( doc.createTextNode( param + '' ) );
    fragment.appendChild( elem );
  }


  /**
   * Serialize a date
   * @static
   * @param {HTMLElement} fragment - DOM fragment to serialize into
   * @param {Date} param      - A string to serialize
   */
  static buildDate( fragment: HTMLElement, param: Date ) {
    const doc = fragment.ownerDocument;
    const elem = doc.createElement('dateTime.iso8601');
    elem.appendChild( doc.createTextNode( param.toISOString() ) );
    fragment.appendChild(elem);
  }


  /**
   * Serialize an array
   * @static
   * @param {HTMLElement} fragment - DOM fragment to serialize into
   * @param {Array} param          - An array to serialize
   */
  static buildArray( fragment: HTMLElement, param: Array<any> ) {
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
   * @param {HTMLElement} fragment  - DOM fragment to serialize into
   * @param {Object} param          - An object to serialize
   */
  static buildObject( fragment: HTMLElement, param: object ) {
    const doc = fragment.ownerDocument;
    const elem = doc.createElement('struct');
    let elem_member, elem_name;

    for ( const [ key, val ] of Object.entries( param ) ) {
      elem_member = doc.createElement('member');
      elem_name = doc.createElement('name');

      elem_name.appendChild( doc.createTextNode( key ) );
      elem_member.appendChild( elem_name );

      this.serializeValue( elem_member, val );
      elem.appendChild( elem_member );
    }
    fragment.appendChild(elem);
  }

}


