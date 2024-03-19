

import type { Client } from '../client.js';

/**
 * File interface class
 * @class
 */
export class FileInterface {

  protected client: Client;

  /**
   * Get a new file interface instance
   */
  constructor( client: Client ) {
    this.client = client;
  }


  /**
   * Start a multicall query
   * @param {String} hash         - The hash to iterate files over
   * @param {String} [filter]     - Any filter for the multicall, eg "*.mkv"
   * @returns {Client}            - Client interface for further chaining
   */
  multiCall( hash: string, filter: string='' ): Client {
    return this.client.addMultiCall( "f.multicall", hash, filter ); 
  }


  /**
   * Get the relative path of a files by index. Gets one output path.
   * @param {String} hash         - The hash to get a path from
   * @param {Number} index        - The file index to get the path for
   * @returns {Client}            - Client interface for further chaining
   */
  getPath( hash: string, index: number ): Client {
    return this.client.addPrimary( 'f.path', hash + ':f' + index );
  }


  /**
   * Sub command to get the relative path of files. Adds output path to outputs.
   * @returns {Client}            - Client interface for further chaining
   */
  subPath( ): Client {
    return this.client.addSub( 'f.path' );
  }

}

