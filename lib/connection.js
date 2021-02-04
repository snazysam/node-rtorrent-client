

import Serializer from './serializer.js';
import Deserializer from './deserializer';

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


class Connection {

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
   *
   */
  constructor( config={} ) {

    this.config = Object.assign( {}, defaultConfig, config );

    if ( config.mode == "rtorrent" )
      this.setupRtorrent();
    else if ( config.mode == "xmlrpc" )
      this.setupXmlrpc();


    this.serializer = new Serializer();
    this.deserializer = new Deserializer();

  }


  /** 
   * Setup a rTorrent direct SCGI connection
   */
  setupRtorrent() {
    var netconf = {};
    var config = this.config;

    if ( ! ( post in config && host in config ) || ! socket in config )
      throw new Error( "Socket or host and port are required for SCGI connections" );

    if ( socket in config )
      netconf[ 'path' ] = config.socket;
    else {
      netconf[ 'host' ] = config.host;
      netconf[ 'port' ] = config.port;
    }

    this.scgiconf = netconf;
  }


  /** 
   * Setup a XMLRPC connection
   * @async {String} xml - XML to send
   */
  setupXmlrpc() {

    var proto, host, port, path, auth;

    host = this.config.host;
    port = this.config.port;
    path = this.config.path;

    if ( 'username' in this.config && 'password' in this.config )
      this.xmlrpcAuth = true;
    else
      this.xmlrpcAuth = false;


    if ( ! host )
      throw new Error( "Host missing for XMLRPC connection" );
    
    if ( this.config.ssl )
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

    var sock, psock, header = '';
    var headers = {
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

      await psock.connect( this.scgiconf );

      await psock.write( header.length.toString() + ":" + header );
      await psock.write( "," );
      await psock.write( xml );
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

  }



  /** 
   * Send a request via XMLRPC
   * @async {String} xml - XML to send
   */
  async sendXmlRPC( xml ) {

    var response;
    var auth = this.xmlrpcAuth;

    try { 

      if ( auth ) {
        response = await Superagent
          .post( this.xmlrpcURL )
          .send( xml )
          .auth( this.config.username, this.config.password )
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
      console.log( "Failed during XMLRPC request:", e );
      throw e;
    }

    return response.text;

  }


  /**
   * Send a request via the appropriate method
   * @param {String} method - The method to execute
   * @param {*[]} params    - The parameters for the method call
   */
  async send( method, params ) {

    var request = this.serializer.serialize( method, params );
    var response;
    var result;

    try { 
      if ( this.config.mode == "scgi" )
        response = await this.sendRtorrent( request );
      else if ( this.config.mode == "xmlrpc" )
        response = await this.sendXmlRPC( request );
    }
    catch (e) {
      throw e;
    }

    result = this.deserializer.deserialize( response );

    return result[0];

  }

}

export default Connection;

