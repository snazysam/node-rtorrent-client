

import type { Client } from '../client.js';

/**
 * System method interface class
 *
 * See the rTorrent XMLRPC manual for information about methods
 * @class
 */
export class SystemInterface {
  protected client: Client;

  /**
   * Get a new system interface instance
   */
  constructor( client: Client ) {
    this.client = client;
  }


  /** 
   * Get a list of all methods supported by rTorrent
   * @returns {Client}            - Client interface for further chaining
   */
  listMethods(): Client {
    return this.client.addCall( 'system.listMethods' );
  }


  /** 
   * Get the rTorrent server API version
   * @returns {Client}            - Client interface for further chaining
   */
  apiVersion(): Client {
    return this.client.addCall( 'system.api_version' );
  }


  /** 
   * Get the rTorrent client version number
   * @returns {Client}            - Client interface for further chaining
   */
  clientVersion(): Client {
    return this.client.addCall( 'system.client_version' );
  }


  /** 
   * Get the rTorrent library version number
   * @returns {Client}            - Client interface for further chaining
   */
  libraryVersion(): Client {
    return this.client.addCall( 'system.library_version' );
  }


  /** 
   * Get the rTorrent current working directory
   * @returns {Client}            - Client interface for further chaining
   */
  cwd(): Client {
    return this.client.addCall( 'system.cwd' );
  }


  /** 
   * Set the rTorrent current working directory
   * @param {String} directory    - Desired working directory
   * @returns {Client}            - Client interface for further chaining
   */
  setCwd( directory: string ): Client {
    return this.client.addCall( 'system.cwd.set', '', directory );
  }


  /** 
   * Get the rTorrent system environment variable value
   * @param {String} variableName - The variable name to retrieve the value
   * @returns {Client}            - Client interface for further chaining
   */
  env( variableName: string ): Client {
    return this.client.addCall( 'system.env', '', variableName );
  }


  /** 
   * Get the rTorrent file allocation mode. Adds a numeric boolean to outputs
   * @returns {Client}            - Client interface for further chaining
   */
  fileAllocate(): Client {
    return this.client.addCall( 'system.file.allocate' );
  }


  /** 
   * Get the rTorrent system hostname 
   * @returns {Client}            - Client interface for further chaining
   */
  hostname(): Client {
    return this.client.addCall( 'system.hostname' );
  }


  /** 
   * Get the rTorrent running process ID
   * @returns {Client}            - Client interface for further chaining
   */
  pid(): Client {
    return this.client.addCall( 'system.pid' );
  }

}


