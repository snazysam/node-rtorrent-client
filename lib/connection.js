

import Serializer from './serializer.js';
import Deserializer from './deserializer.js';

import Superagent from 'superagent';
import {PromiseSocket, TimeoutError} from "promise-socket"
import net from 'net';


const defaultConfig = {
  mode    : "scgi",
  ssl     : false,
  host    : "127.0.0.1",
  port    : "8080",
  path    : "/RPC2"
}


/** 
 * A connection handler to rTorrent
 * @class
 */
export default class Connection {

  /**
   * Create a new connection
   * @param {Object}  config                  - Configuration object
   * @param {String}  config.mode=scgi        - The connection mode, either 'scgi' (direct) or 'xmlrpc' (via HTTP)
   * @param {Number}  [config.port=8080]      - The port to connect to if using TCP connectivity
   * @param {String}  [config.host=127.0.0.1] - The host IP or name if ysing TCP connectivity
   * @param {Boolean} [config.ssl=false]      - Enable or disable SSL
   * @param {String}  [config.path=/RPC2]     - The path for the XMLRPC HTTP connection
   * @param {String}  [config.username]       - The HTTP auth basic username if required
   * @param {String}  [config.password]       - The HTTP auth basic password if required
   * @param {String}  [config.socket]         - The socket path if using unix sockets for connectivity
   */
  constructor( config={} ) {
    this._config = Object.assign( {}, defaultConfig, config );

    this._xmlrpcAuth = false;
    this._scgiconf = undefined;

    if ( config.mode == "scgi" )
      this.setupRtorrent();
    else if ( config.mode == "xmlrpc" )
      this.setupXmlrpc();
    else
      throw new Error( `Unknown connection mode ${config.mode}` );
  }


  /** 
   * Setup a rTorrent direct SCGI connection
   */
  setupRtorrent() {
    const netconf = {};
    const config = this._config;

    if ( ! ( config.port && config.host ) && ! config.socket )
      throw new Error( "Socket or host and port are required for SCGI connections" );

    if ( 'socket' in config && config.socket )
      netconf[ 'path' ] = config.socket;
    else {
      netconf[ 'host' ] = config.host;
      netconf[ 'port' ] = config.port;
    }

    this._scgiconf = netconf;
  }


  /** 
   * Setup a XMLRPC connection
   */
  setupXmlrpc() {
    const host = this._config.host;
    const port = this._config.port;
    const path = this._config.path;
    const config = this._config;
    let proto;

    if ( config.username && config.password )
      this._xmlrpcAuth = true;
    else
      this._xmlrpcAuth = false;

    if ( ! host )
      throw new Error( "Host missing for XMLRPC connection" );
    
    if ( this._config.ssl )
      proto = "https";
    else
      proto = "http";

    // Set URL
    this.xmlrpcURL = proto + "://" + host + ":" + port + path;

  }



  /**
   * Send via rtorrent
   * @async {String} xml - XML to send
   */
  async sendRtorrent( xml ) {
    let response, sock, psock, header = '';
    const headers = {
      "CONTENT_LENGTH"    : xml.length,
      "SCGI"              : 1,
      "REQUEST_METHOD"    : 'POST',
      "REQUEST_URI"       : '/'
    };

    for ( let h in headers ) {
      header += h + String.fromCharCode(0) + headers[h] + String.fromCharCode(0);
    }

    sock  = new net.Socket();
    psock = new PromiseSocket( sock );

    try {
      psock.setTimeout(2000);

      await psock.connect( this._scgiconf );

      await psock.write( header.length.toString() + ":" + header );
      await psock.write( "," );
      await psock.write( xml );

      response = await psock.readAll();
      if ( ! response )
        throw new Error( "Failed to read response" );

      await psock.end();
    }
    catch( e ) {
      if ( e instanceof TimeoutError ) {
        throw new Error( "SCGI timeout." );
      }
      else {
        throw new Error( "SCGI request failed: " + e.message );
      }
    }

    return response.toString();
  }



  /** 
   * Send a request via XMLRPC
   * @async
   * @param {String} xml        - XML fragment to send
   * @returns {Promise<String>} - Raw XML response
   * @throws                    - If XML communication is unsuccessful
   */
  async sendXmlRPC( xml ) {
    let response;

    try { 
      if ( 'username' in this._config && 'password' in this._config ) {
        response = await Superagent
          .post( this.xmlrpcURL )
          .send( xml )
          .auth( this._config.username, this._config.password )
          .type( 'text/xml' )
          .accept( 'text/xml' );
      }
      else {
        response = await Superagent
          .post( this.xmlrpcURL )
          .send( xml )
          .type( 'text/xml' )
          .accept( 'text/xml' );
      }
      if ( response.status != "200" )
        throw new Error( "XMLRPC request failed with: " + response.body );
    }
    catch (e) {
      throw e;
    }

    return response.text;
  }


  /**
   * Send a request via the appropriate method
   * @async
   * @param {String} method - The method to execute
   * @param {*[]} params    - The parameters for the method call
   */
  async send( method, params ) {
    const request = Serializer.serialize( method, params );
    let response, result;

    try { 
      if ( this._config.mode == "scgi" )
        response = await this.sendRtorrent( request );
      else if ( this._config.mode == "xmlrpc" )
        response = await this.sendXmlRPC( request );
    }
    catch (e) {
      throw e;
    }

    result = Deserializer.deserialize( response );
    return result[0];
  }

}

