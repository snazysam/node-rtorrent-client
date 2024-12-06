

import { Serializer } from './serializer.js';
import { Deserializer } from './deserializer.js';

import Superagent from 'superagent';
import {PromiseSocket, TimeoutError} from "promise-socket"
import net from 'net';

import type { URLType } from 'superagent/types.js';
import type { CallParam } from './client.js';


export interface ConnectionConfig {
  mode: string,
  host: string,
  port: number,
  ssl: boolean,
  path: string,
  username: string,
  password: string,
  socket: string
};

interface HeadObj {
  [ key: string ]: any
}

const defaultConfig = {
  mode    : "scgi",
  ssl     : false,
  host    : "127.0.0.1",
  port    : 8080,
  path    : "/RPC2"
}


/**
 * A connection handler to rTorrent
 * @class
 */
export class Connection {

  private _config: ConnectionConfig;
  private _scgiconf!: net.SocketConnectOpts;
  private _xmlrpcURL!: URLType;

  /**
   * Create a new connection
   * @param {ConnectionConfig}  config        - Configuration object
   * @param {String}  config.mode=scgi        - The connection mode, either 'scgi' (direct) or 'xmlrpc' (via HTTP)
   * @param {Number}  [config.port=8080]      - The port to connect to if using TCP connectivity
   * @param {String}  [config.host=127.0.0.1] - The host IP or name if ysing TCP connectivity
   * @param {Boolean} [config.ssl=false]      - Enable or disable SSL
   * @param {String}  [config.path=/RPC2]     - The path for the XMLRPC HTTP connection
   * @param {String}  [config.username]       - The HTTP auth basic username if required
   * @param {String}  [config.password]       - The HTTP auth basic password if required
   * @param {String}  [config.socket]         - The socket path if using unix sockets for connectivity
   */
  constructor( config: ConnectionConfig ) {
    this._config = Object.assign( {}, defaultConfig, config );

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
    const config = this._config;

    if ( ! ( config.port && config.host ) && ! config.socket )
      throw new Error( "Socket or host and port are required for SCGI connections" );

    if ( 'socket' in config && config.socket ) {
      this._scgiconf = { path: config.socket };
    }
    else
      this._scgiconf = { host: config.host, port: config.port };
  }


  /**
   * Setup a XMLRPC connection
   */
  setupXmlrpc() {
    const host = this._config.host;
    const port = this._config.port;
    const path = this._config.path;
    let proto;

    if ( ! host )
      throw new Error( "Host missing for XMLRPC connection" );

    if ( this._config.ssl )
      proto = "https";
    else
      proto = "http";

    // Set URL
    this._xmlrpcURL = proto + "://" + host + ":" + port + path;
  }



  /**
   * Send via rtorrent
   * @async
   * @param {String} xml        - XML to send
   * @returns {Promise<String>} - Response XML
   * @throws                    - If SCGI communication is unsuccessful
   */
  async sendRtorrent( xml: string ): Promise<string> {
    let response, sock, psock, header = '';
    const headers: HeadObj={
      "CONTENT_LENGTH"    : xml.length + '',
      "SCGI"              : '1',
      "REQUEST_METHOD"    : 'POST',
      "REQUEST_URI"       : '/'
    };

    let headkey: keyof typeof headers;
    for ( headkey in headers ) {
      header += headkey + String.fromCharCode(0) + headers[ headkey ] + String.fromCharCode(0);
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
    catch( err ) {
      if ( err instanceof TimeoutError ) {
        throw new Error( "SCGI timeout." );
      }
      else {
        throw new Error( "SCGI request failed: " + (err as Error).message );
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
  async sendXmlRPC( xml: string ): Promise<string> {
    let response;

    try {
      if ( 'username' in this._config && 'password' in this._config ) {
        response = await Superagent
          .post( this._xmlrpcURL )
          .send( xml )
          .auth( this._config.username, this._config.password )
          .type( 'text/xml' )
          .accept( 'text/xml' );
      }
      else {
        response = await Superagent
          .post( this._xmlrpcURL )
          .send( xml )
          .type( 'text/xml' )
          .accept( 'text/xml' );
      }
      if ( response.status !== 200 )
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
   * @param {String} method       - The method to execute
   * @param {CallParam[]} params  - The parameters for the method call
   * @throws                      - If communication is not successful
   */
  async send( method: string, params: CallParam[] ) {
    const request = Serializer.serialize( method, params );
    let response, result;

    try {
      if ( this._config.mode == "scgi" )
        response = await this.sendRtorrent( request );
      else if ( this._config.mode == "xmlrpc" )
        response = await this.sendXmlRPC( request );
      else
        throw new Error( "Unknown connection mode" );
    }
    catch (e) {
      throw e;
    }

    result = Deserializer.deserialize( response );
    return result[0];
  }

}

