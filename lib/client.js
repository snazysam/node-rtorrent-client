


import Connection from './connection.js';

import { SystemInterface } from './interface/system.js';
import { TorrentInterface } from './interface/torrent.js';
import { FileInterface } from './interface/file.js';



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
 *
 * @class
 */
export class Client {

  /**
   * Instantiate a new client
   * @param {Object} connectionConfig   - Connection configuration
   * @see Connection#constructor
   */
  constructor( connectionConfig ) {
    this.connection = new Connection( connectionConfig );    

    // Track call context
    this._context = 'primary';
    this._calls = [];

    // Import interfaces
    this.system = new SystemInterface( this );
    this.torrent = new TorrentInterface( this );
    this.file = new FileInterface( this );
  }


  /**
   * Reset the client except for connection information
   */
  reset() {
    this._calls = [];
    this._context = 'primary';
  }


  /**
   * Test the connection to rtorrent
   * @async
   * @returns {Promise<String>} - Resolves if able to connect
   * @throws                    - Rejects if unable to connect
   */
  async testConnection() {
    return await this.system.apiVersion().send();
  }


  /**
   * Add a multicall method to the call queue
   * @param {String} method     - Method name
   * @param {*[]} params        - Call parameters as required
   * @returns {this}            - Client object to chain calls
   */
  addMultiCall( method, ...params ) {
    this.requiresContext( [ 'primary' ] );
    this._calls.push( method, ...params );
    this._context = "sub";
    return this;
  }


  /** 
   * Add a call to the stack which is usable as a primary or sub command
   * @param {String} method     - Method name
   * @param {*} [hash]          - First parameter, typically a hash. Ignored for sub call.
   * @param {...*} [params]     - Parameters for the call
   * @returns {this}            - Client object to chain calls
   */
  addCall( method, hash=undefined, ...params ) {
    this.requiresContext( [ 'sub', 'primary' ] );
    if ( this._context == "sub" )
      return this.addSub( method, ...params );
    else
      return this.addPrimary( method, hash, ...params );
  }


  /** 
   * Add a primary-only call to the stack
   * @param {String} method     - Method name
   * @param {*} [hash]          - First parameter, typically a hash.
   * @param {...*} [params]     - Parameters for the call
   * @returns {this}            - Client object to chain calls
   */
  addPrimary( method, hash=undefined, ...params ) {
    this.requiresContext( [ 'primary' ] );
    this._calls.push( method, hash, ...params );
    // Prevent sub-calls
    this._context = "none";
    return this;
  }


  /**
   * Add a method to the queue that can only be a sub command
   * @param {String} method     - The method name to call
   * @param {...*} [params]     - Parameters for the call
   * @returns {this}            - Client object to chain calls
   */
  addSub( method, ...params ) {
    this.requiresContext( [ 'sub' ] );
    this._calls.push( method + "=" + params.join( ',' ) );
    return this;
  }



  /**
   * Check call stack is in a required context
   * @param {String[]} contexts - Permissable contexts
   * @throws                    - If context is not as required
   */
  requiresContext( contexts ) {
    if ( contexts.indexOf( this._context ) == -1 )
      throw new Error( "Context is " + this._context + ". Call requires context of " + contexts.join( ',' ) );
  }


  /**
   * Send our queued commands or something different
   * @async
   * @param {...*} calls - Any method and parameter arguments to send instead of queued calls.
   */
  async send( ...calls ) {
    let method, result, usingQueued = false;

    // Use provided calls or our own
    if ( ! calls || ! calls.length ) {
      calls = this._calls;
      usingQueued = true;
    }

    method = calls.shift();

    try { 
      result = await this.connection.send( method, calls );
    }
    catch( err ) {
      throw new Error( `Failed to send command: ${err.message}` );
    }

    // Clear our queue
    if ( usingQueued )
      this.reset();

    return result;
  }

}

