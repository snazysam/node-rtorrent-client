
import XMLDom from 'xmldom';


const DOMParser = XMLDom.DOMParser;


class Serializer {

  constructor() {
  }


  /** 
   * Serialize to XML
   * @param {String} method - The method to call
   * @param {*[]} params    - Parameters for the call
   */
  serialize( method, params ) {

    var template = '<?xml version="1.0"?><methodCall><methodName></methodName><params></params></methodCall></xml>';

    var doc = new DOMParser().parseFromString(template);
    var dom_methodName = doc.getElementsByTagName('methodName')[0];
    var dom_params = doc.getElementsByTagName('params')[0];
    dom_methodName.appendChild( doc.createTextNode( method ) );

    for ( var i = 0 ; i < params.length ; i += 1 ) {
      if (params[i]) {
        var dom_param = doc.createElement('param');
        this.serializeValue(dom_param, params[i])
        dom_params.appendChild(dom_param)
      }
    }
    return doc.toString();
  }



  /**
   * Serialize a value
   * @param {Object} fragment - DOM fragment
   * @param {*[]} param       - Parameter to serialize
   */
  serializeValue( fragment, param ) {

    var doc = fragment.ownerDocument;
    var dom = doc.createElement('value');
    var type = typeof param;

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
   * Serialize a string
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {String} param    - A string to serialize
   */
  buildString( fragment, param ) {
    var doc = fragment.ownerDocument;
    var dom = doc.createElement('string');

    // Support URLs and such
    if ( ! param.match( /^(?![^<&]*]]>[^<&]*)[^<&]*$/ ) )
      this.buildData( dom, param );
    else
      dom.appendChild( doc.createTextNode( param ) );

    fragment.appendChild( dom );
  }


  /** Serialize character data
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {String} param    - A string to serialize
   */
  buildData( fragment, param ) {
    var doc = fragment.ownerDocument;
    var dom = doc.createCDATASection( param );

    fragment.appendChild( dom );
  }


  /**
   * Serialize a number
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {Number} param    - A string to serialize
   */
  buildNumber( fragment, param ) {
    var doc = fragment.ownerDocument;
    var dom;

    if ( param % 1 == 0 )
      dom = doc.createElement( 'int' );
    else
      dom = doc.createElement( 'double' );

    dom.appendChild( doc.createTextNode( param ) );
    fragment.appendChild( dom );
  }


  /**
   * Serialize a date
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {Date} param      - A string to serialize
   */
  buildDate( fragment, param ) {
    var doc = fragment.ownerDocument;
    var dom = doc.createElement('dateTime.iso8601');

    dom.appendChild( doc.createTextNode( param.toISOString() ) );
    fragment.appendChild(dom);
  }


  /**
   * Serialize an array
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {Array} param     - An array to serialize
   */
  buildArray( fragment, param ) {
    var doc = fragment.ownerDocument;
    var dom = doc.createElement('array');
    var data = doc.createElement('data');

    // Recursively serialize
    for ( var i = 0 ; i < param.length ; i += 1 )
      this.serializeValue( data, param[i] );

    dom.appendChild(data);
    fragment.appendChild(dom);
  }


  /**
   * Serialize an object
   * @param {Object} fragment - DOM fragment to serialize into
   * @param {Object} param    - An object to serialize
   */
  buildObject( fragment, param ) {
    var doc = fragment.ownerDocument;
    var dom = doc.createElement('struct');

    for (var key in param) {
      var dom_member = doc.createElement('member');
      var dom_name = doc.createElement('name');

      dom_name.appendChild( doc.createTextNode( key ) );
      dom_member.appendChild( dom_name );

      this.serializeValue( dom_member, param[ key ] );
      dom.appendChild( dom_member );
    }
    fragment.appendChild(dom);
  }

}


export default Serializer;

