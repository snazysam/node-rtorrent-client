


import { Connection, ConnectionConfig } from './connection.js';

import { SystemInterface } from './interface/system.js';
import { TorrentInterface } from './interface/torrent.js';
import { FileInterface } from './interface/file.js';
import { XMLFaultError } from './deserializer.js';


export type CallParam = string | number | Buffer | undefined;
type Context = 'none' | 'sub' | 'primary';

/**
 * A XMLRPC client for rtorrent
 *
 * This class does not check for call combinations that are invalid. Refer
 * to the rTorrent XMLRPC for method information.
 *
 * Due to the call queueing nature of this client, always chain mutli-command
 * calls together to ensure that no unexpected calls enter the stack.
 *
 * @property {SystemInterface} system    - The system interface
 * @property {FileInterface} file        - The file interface
 * @property {TorrentInterface} torrent  - The torrent interface
 * @class
 */
export class Client {

  private context: Context;
  private calls: CallParam[];

  protected connection: Connection;
  public system: SystemInterface;
  public torrent: TorrentInterface;
  public file: FileInterface;

  /**
   * Instantiate a new client
   * @param {ConnectionConfig} connectionConfig   - Connection configuration
   */
  constructor( connectionConfig: ConnectionConfig ) {
    this.connection = new Connection( connectionConfig );

    // Track call context
    this.context = 'primary';
    this.calls = [];

    // Import interfaces
    this.system = new SystemInterface( this );
    this.torrent = new TorrentInterface( this );
    this.file = new FileInterface( this );
  }


  /**
   * Reset the client except for connection information
   */
  public reset(): void {
    this.calls = [];
    this.context = 'primary';
  }


  /**
   * Test the connection to rtorrent
   * @async
   * @returns {Promise<String>} - Resolves if able to connect
   * @throws                    - Rejects if unable to connect
   */
  public async testConnection(): Promise<boolean> {
    await this.system.apiVersion().send();
    return true;
  }


  /**
   * Add a multicall method to the call queue
   * @param {String} method         - Method name
   * @param {CallParam[]} params    - Call parameters as required
   * @returns {this}                - Client object to chain calls
   */
  public addMultiCall( method: string, ...params: CallParam[] ): this {
    this.requiresContext( [ 'primary' ] );
    this.calls.push( method, ...params );
    this.context = "sub";
    return this;
  }


  /**
   * Add a call to the stack which is usable as a primary or sub command
   * @param {String} method         - Method name
   * @param {CallParam} [hash]      - First parameter, typically a hash. Ignored for sub call.
   * @param {...CallParam} [params] - Parameters for the call
   * @returns {this}                - Client object to chain calls
   */
  public addCall( method: string, hash: CallParam=undefined, ...params: CallParam[] ): this {
    this.requiresContext( [ 'sub', 'primary' ] );
    if ( this.context == "sub" )
      return this.addSub( method, ...params );
    else
      return this.addPrimary( method, hash, ...params );
  }


  /**
   * Add a primary-only call to the stack
   * @param {String} method           - Method name
   * @param {CallParam} [hash]        - First parameter, typically a hash.
   * @param {...CallParam} [params]   - Parameters for the call
   * @returns {this}                  - Client object to chain calls
   */
  public addPrimary( method: string, hash: CallParam=undefined, ...params: CallParam[] ): this {
    this.requiresContext( [ 'primary' ] );
    this.calls.push( method, hash, ...params );
    // Prevent sub-calls
    this.context = "none";
    return this;
  }


  /**
   * Add a method to the queue that can only be a sub command
   * @param {String} method         - The method name to call
   * @param {...CallParam} [params] - Parameters for the call
   * @returns {this}                - Client object to chain calls
   */
  public addSub( method: string, ...params: CallParam[] ): this {
    this.requiresContext( [ 'sub' ] );
    this.calls.push( method + "=" + params.join( ',' ) );
    return this;
  }



  /**
   * Check call stack is in a required context
   * @param {Context[]} contexts - Permissable contexts
   * @throws                      - If context is not as required
   */
  private requiresContext( contexts: Context[] ) {
    if ( ! contexts.includes( this.context ) )
      throw new Error( "Context is " + this.context + ". Call requires context of " + contexts.join( ', or ' ) );
  }


  /**
   * Send our queued commands or something different
   * @async
   * @param {...CallParam} [calls] - Any method and parameter arguments to send instead of queued calls.
   * @throws - Throws either a FaultError or generic Error if unable to complete the procedure call.
   */
  async send( ...calls: CallParam[] ) {
    let method, result, usingQueued = false;

    // Use provided calls or our own
    if ( ! calls || ! calls.length ) {
      calls = this.calls;
      usingQueued = true;
    }

    method = calls.shift();

    try {
      result = await this.connection.send( method as string, calls );
    }
    catch( err ) {
      if ( err instanceof XMLFaultError )
        throw err;
      else
        throw new Error( `Failed to send command: ${(err as Error).message}` );
    }

    // Clear our queue
    if ( usingQueued )
      this.reset();

    return result;
  }

}

