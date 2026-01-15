

import { Serializer } from './serializer.js';
import { Deserializer } from './deserializer.js';

import {PromiseSocket, TimeoutError} from "promise-socket"
import net from 'node:net';
import url, {UrlObject} from 'node:url';
import https from 'node:https';
import http from 'node:http';

import type { CallParam } from './client.js';
import {randomInt} from 'node:crypto';


type ConnectionMode = "scgi" | "http";
type RPCType = "xml" | "json";

interface ConnectionConfig {
  mode: ConnectionMode,
  rpctype: RPCType,
  socket?: string
  host?: string,
  port?: number,
  ssl?: boolean,
  verify?: boolean,
  path?: string,
  username?: string,
  password?: string,
};

interface HeadObj {
  [ key: string ]: any
}

const defaultConfig = {
  mode      : "scgi",
  protocol  : "xml",
  ssl       : false,
  verify    : true,
  host      : "127.0.0.1",
  port      : 8080,
  path      : "/RPC2"
}


/**
 * A connection handler to rTorrent
 * @class
 */
class Connection {

  private config: ConnectionConfig;
  private endpoint!: net.SocketConnectOpts | url.UrlObject;

  /**
   * Create a new connection
   * @param {ConnectionConfig}  config          - Configuration object
   * @param {String}  config.mode=scgi          - The connection mode, either 'scgi' or 'http'
   * @param {String}  [config.rpctype=xml]      - Type of RPC communication, xml or json
   * @param {String}  [config.socket]           - IPC socket path for SCGI connection
   * @param {Number}  [config.port=8080]        - Port number for TCP or HTTP connections
   * @param {String}  [config.host=127.0.0.1]   - Host IP or name for TCP or HTTP connections
   * @param {Boolean} [config.ssl=false]        - Enable or disable SSL
   * @param {Boolean} [config.verify=true]      - Enable or disable SSL certificate verification
   * @param {String}  [config.path=/RPC2]       - HTTP request path
   * @param {String}  [config.username]         - HTTP auth username if required
   * @param {String}  [config.password]         - HTTP auth password if required
   */
  constructor( config: ConnectionConfig ) {
    this.config = Object.assign( {}, defaultConfig, config );

    this.setupConnection();
  }



  /**
   * Check provided options and setup the connection endpoint
   * @private
   * @throws
   */
  private setupConnection(): void {
    const config = this.config;
    let url: url.UrlObject = {};

    if ( config.mode == "scgi" ) {
      if ( 'socket' in config && config.socket ) {
        this.endpoint = { path: config.socket };
      }
      else if ( 'host' in config && 'port' in config && config.host && config.port ) {
        this.endpoint = { port: config.port, host: config.host };
      }
      else
        throw new Error( "SCGI connection requires IPC or TCP socket options" );
    }
    else if ( config.mode == "http" ) {
      url.host = config.host;
      url.port = config.port;
      url.pathname = config.path;
      if ( config.ssl )
        url.protocol = 'https';
      else
        url.protocol = 'http';
      if ( 'username' in config && 'password' in config && config.username && config.password ) {
        url.auth = config.username + ':' + config.password;
      }
      this.endpoint = url;
    }
    else
      throw new Error( "Unknown connectioning mode" );

  }


  /**
   * Send via rtorrent's SCGI
   * @private
   * @async
   * @param {RPCType} payloadType  - Type of payload, xml or json
   * @param {String} payload        - Payload of XML or JSON to send
   * @returns {Promise<String>}     - Response in XML or JSON
   * @throws                        - If SCGI communication was unsuccessful
   */
  private async sendSCGI( payloadType: RPCType, payload: string ): Promise<string> {
    let reply: string[] = [""];
    let body: string;
    let response, sock, psock, header = '';

    let headers: HeadObj={
      "CONTENT_LENGTH"    : payload.length + '',
      "SCGI"              : '1',
      "REQUEST_METHOD"    : 'POST',
      "REQUEST_URI"       : '/'
    };

    if ( payloadType == "xml" )
      headers[ "CONTENT_TYPE" ] = 'text/xml';
    else if ( payloadType == "json" )
      headers[ "CONTENT_TYPE" ] = 'application/json';

    for ( let headkey in headers ) {
      header += headkey + String.fromCharCode(0) + headers[ headkey ] + String.fromCharCode(0);
    }

    sock  = new net.Socket();
    psock = new PromiseSocket( sock );

    if ( ! this.isSocket( this.endpoint ) )
      throw new Error( "Unix or TCP port required" );

    try {
      psock.setTimeout(2000);

      await psock.connect( this.endpoint );

      await psock.write( header.length.toString() + ":" + header );
      await psock.write( "," );
      await psock.write( payload );

      response = await psock.readAll();
      if ( ! response )
        throw new Error( "Failed to read response" );

      await psock.end();

      if ( payloadType == "xml" )
        reply = Deserializer.deserialize( response.toString() );
      else if ( payloadType == "json" ) {
        body = response.toString();
        body = body.slice( body.indexOf( '{' ) );
        reply = [ JSON.parse( body ).result ];
      }
    }
    catch( err ) {
      if ( err instanceof TimeoutError ) {
        throw new Error( "SCGI timeout." );
      }
      else {
        if ( response )
        throw new Error( "SCGI request failed: " + (err as Error).message );
      }
    }

    return reply[0];
  }


  /**
   * Send a request via HTTP
   * @async
   * @param {RPCType} payloadType  - Payload type, xml or json
   * @param {String} payload        - XML fragment to send
   * @returns {Promise<String>}     - Raw XML response
   * @throws                        - If XML communication is unsuccessful
   */
  private async sendHTTP( payloadType: RPCType, payload: string ): Promise<string> {
    let response;
    let url: string;
    let request: Request;
    let opts: any = {};
    let result: string[] = [""];
    let agent: https.Agent;

    if ( ! this.isURLObject( this.endpoint ) )
      throw new Error( "HTTP connection configuration required" );

    url = this.endpoint.protocol + '://' + this.endpoint.host + ':' + this.endpoint.port + this.endpoint.pathname;

    if ( this.config.ssl && ! this.config.verify ) {
      agent = new https.Agent( { rejectUnauthorized: false } );
      opts[ "agent" ] = agent;
    }

    try {
      request = new Request( url );

      opts[ "method" ] = "POST";
      opts[ "headers" ] = {};
      opts[ "body" ] = payload;

      if ( payloadType == "xml" )
        opts.headers[ 'Content-Type' ] = 'text/xml';
      else if ( payloadType == "json" )
        opts.headers[ 'Content-Type' ] = 'application/json';

      if ( this.endpoint.auth ) {
        opts.headers[ 'Authorization' ] = 'Basic ' + btoa( this.endpoint.auth );
      }

      response = await fetch( request, opts );

      if ( ! response.ok )
        throw new Error( "Request failed: " + response.statusText );

      if ( payloadType == "xml" ) {
        let resp = await response.text();
        result = Deserializer.deserialize( resp );
      }
      else if ( payloadType == "json" ) {
        let resp = await response.json();
        result = resp;
      }

    }
    catch( err ) {
      throw err;
    }

    return result[0];
  }


  /**
   * Send a request via the appropriate method
   * @async
   * @param {String} method       - The method to execute
   * @param {CallParam[]} params  - The parameters for the method call
   * @throws                      - If communication is not successful
   */
  async send( method: string, params: CallParam[] ) {
    let response: any;
    let payload: string = "";

    if ( this.config.rpctype == "xml" )
      payload = Serializer.serialize( method, params) ;
    else if ( this.config.rpctype == "json" ) {
      payload = "";
      let json = {
        'jsonrpc': '2.0',
        'method': method,
        'params': params,
        'id': randomInt( 32768 ) + 1
      };
      if ( json.params[ 0 ] == null )
        json.params = [];
      payload = JSON.stringify( json );
    }

    try {
      if ( this.config.mode == "scgi" )
        response = await this.sendSCGI( this.config.rpctype, payload );
      else if ( this.config.mode == "http" )
        response = await this.sendHTTP( this.config.rpctype, payload );
      else
        throw new Error( "Unknown connection mode" );
    }
    catch (e) {
      throw e;
    }

    return response;
  }



  /**
   * Check for a URLObject
  */
  private isURLObject( T: any ): T is UrlObject {
    return T
      && typeof T == "object"
      && ( 'protocol' in T )
      && ( 'pathname' in T && 'host' in T )
  }


  /**
   * Check for a IPC or TCP socket type
   */
  private isSocket( T: any ): T is net.SocketConnectOpts {
    return T
      && typeof T == "object"
      && ( ! ('protocol' in T) )
      && ( ( 'path' in T ) || ( 'port' in T && 'host' in T ) )
  }

}


export {
  Connection,
  ConnectionConfig,
  ConnectionMode,
  RPCType
};
