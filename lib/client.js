


import Connection from './connection.js';
import TorrentInterface from './interface/torrent.js';

import System from './interface/system.js';
import Torrent from './interface/torrent.js';
import File from './interface/file.js';



/**
 * A XMLRPC client for rtorrent
 *
 * This class does not check for call combinations that are invalid. Refer
 * to the rTorrent XMLRPC for method information.
 *
 * Due to the call queueing nature of this client, always chain mutli-command 
 * calls together to ensure that no unexpected calls enter the stack.
 *
 * @class
 */
class Client {

  constructor( connectionConfig ) {
    this.connection = new Connection( connectionConfig );    

    // Track call context
    this.context = 'primary';
    this.calls = [];


    // Import interfaces
    this.system = new System( this );
    this.torrent = new Torrent( this );
    this.file = new File( this );
  }


  /**
   * Reset the client except for connection information
   */
  reset() {
    this.calls = [];
    this.context = 'primary';
  }


  /**
   * Test the connection to rtorrent
   * @async
   * @returns {Boolean} - If able to connect
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
    this.calls.push( method, ...params );
    this.context = "sub";
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
    if ( this.context == "sub" )
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
    this.calls.push( method, hash, ...params );
    // Prevent sub-calls
    this.context = "none";
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
    this.calls.push( method + "=" + params.join( ',' ) );
    return this;
  }



  /**
   * Check call stack is in a required context
   * @param {String[]} contexts - Permissable contexts
   */
  requiresContext( contexts ) {
    if ( contexts.indexOf( this.context ) == -1 )
      throw new Error( "Context is " + this.context + ". Call requires context of " + contexts.join( ',' ) );
  }


  /**
   * Send our queued commands or something different
   * @async
   * @param {...*} args - Any method and parameter arguments to send instead of queued calls.
   */
  async send( ...args ) {
    var calls, method, result;
    var queued = true;

    // Use provided calls or our own
    if ( args.length > 0 ) {
      calls = args;
      queued = false;
    }
    else 
      calls = this.calls;

    method = calls.shift();

    try { 
      result = await this.connection.send( method, calls );
    }
    catch( e ) {
      throw e;
    }

    if ( queued )
      this.reset();

    return result;
  }

}

export default Client;

