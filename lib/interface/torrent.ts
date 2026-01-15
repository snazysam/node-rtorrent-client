
import assert from 'assert';
import type { Client } from '../client.js';

/**
 * Torrent interface class
 * @class
 */
export class TorrentInterface {

  protected client: Client;

  /**
   * Get a new torrent interface instance
   */
  constructor( client: Client ) {
    this.client = client;
  }

  /**
   * Start a multicall query
   * @param {String} view         - View the multicall query operates on
   * @returns {Client}            - Client interface for further chaining
   */
  multiCall( view: string='' ): Client {
    return this.client.addMultiCall( "d.multicall2", '', view );
  }

  /**
   * Start a multicall query with a filter
   * @param {String} view         - View the multicall query operates on
   * @param {String} predicate    - The predicate string sub-command, eg 'equal=d.custom=foo,cat=bar'
   * @returns {Client}            - Client interface for further chaining
   */
  multiCallFiltered( view: string='', predicate: string='' ): Client {
    return this.client.addMultiCall( "d.multicall.filtered", '', view, predicate );
  }


  /**
   * Stop one torrent
   * @param {String|undefined} [hash] - Hash of torrent to stop, undefined if a sub call
   * @returns {Client}                - Client interface for further chaining
   */
  stop( hash: string | undefined=undefined ): Client {
    return this.client.addCall( "d.stop", hash );
  }

  /**
   * Start one torrent
   * @param {String|undefined} [hash] - Hash of torrent to start, undefined if a sub call
   * @returns {Client}                - Client interface for further chaining
   */
  start( hash: string | undefined=undefined ): Client {
    return this.client.addCall( "d.start", hash );
  }


  /**
   * Load one torrent
   * @param {String|Buffer} thing - Buffer or URL
   * @param {Boolean} start       - Whether to start the torrent on load
   * @returns {Client}            - Client interface for further chaining
   */
  load( thing: string | Buffer, start: boolean=false ): Client {
    const buf = Buffer.isBuffer( thing );
    let method;
    if ( buf && start )
      method = 'load.raw_start';
    else if ( buf )
      method = 'load.raw';
    else if ( start )
      method = 'load.start';
    else
      method = 'load.normal';

    return this.client.addMultiCall( method, '', thing );
  }


  /**
   * Get the hash for a chained torrent. Adds the hash to outputs
   * @returns {Client}            - Client interface for further chaining
   */
  hash(): Client {
    return this.client.addSub( 'd.hash' );
  }


  /**
   * Get the name for a torrent. Adds a numeric boolean to outputs
   * @param {String|undefined} hash - Hash of torrent, undefined if a sub call
   * @returns {Client}              - Client interface for further chaining
   */
  name( hash: string | undefined=undefined ): Client{
    return this.client.addCall( "d.name", hash );
  }


  /**
   * Check if torrent is multi-file or not. Adds a numeric boolean to outputs
   * @param {String|undefined} hash - Hash of torrent, undefined if a sub call
   * @returns {Client}              - Client interface for further chaining
   */
  isMultiFile( hash: string | undefined=undefined ): Client {
    return this.client.addCall( "d.is_multi_file", hash );
  }


  /**
   * Get the current download directory of a torrent. Adds the path to outputs
   * @param {String|undefined} hash - Hash of torrent, undefined if a sub call
   * @returns {Client}              - Client interface for further chaining
   */
  getDirectory( hash: string | undefined=undefined ): Client {
    return this.client.addCall( "d.directory", hash );
  }


  /**
   * Set the current download directory of a torrent.
   * @param {String} directory      - Desired directory
   * @param {String|undefined} hash - Hash of torrent, undefined if a sub call
   * @returns {Client}              - Client interface for further chaining
   */
  setDirectory( directory: string, hash: string | undefined=undefined ): Client {
    return this.client.addCall( "d.directory.set", hash, directory );
  }


  /**
   * Set the current label of a torrent, assuming custom1 is the label in your client
   * @param {String} label          - Desired label
   * @param {String|undefined} hash - Hash of torrent, undefined if a sub call
   * @returns {Client}              - Client interface for further chaining
   */
  setLabel( label: string, hash: string | undefined=undefined ): Client {
    return this.client.addCall( "d.custom1.set", hash, label );
  }


  /**
   * Get the current label of a torrent. Adds the label to outputs
   * @param {String|undefined} hash - Hash of torrent, undefined if a sub call
   * @returns {Client}              - Client interface for further chaining
   */
  getLabel( hash: string | undefined=undefined ): Client {
    return this.client.addCall( "d.custom1", hash );
  }


  /**
   * Get the value of a numbered custom variable. Adds the value to outputs
   * @param {Number} num            - Custom property number, 1 to 5
   * @param {String|undefined} hash - Hash of torrent, undefined if a sub call
   * @returns {Client}              - Client interface for further chaining
   */
  getCustomN( num: number, hash: string | undefined=undefined ): Client {
    assert( num >= 1 && num <= 5 );
    return this.client.addCall( 'd.custom' + num, hash );
  }


  /**
   * Set the value of a numbered custom variable.
   * @param {Number} num            - Custom property number, 1 to 5
   * @param {String} value          - Value for the custom variable
   * @param {String|undefined} hash - Hash of torrent, undefined if a sub call
   * @returns {Client}              - Client interface for further chaining
   */
  setCustomN( num: number, value: string, hash: string | undefined=undefined ): Client {
    assert( num >= 1 && num <= 5 );
    return this.client.addCall( 'd.custom' + num + '.set', hash, value );
  }



  /**
   * Get the value of a custom variable. Adds the value to outputs
   * @param {String} variable       - Name of the variable
   * @param {String|undefined} hash - Hash of torrent, undefined if a sub call
   * @returns {Client}              - Client interface for further chaining
   */
  getCustom( variable: string, hash: string | undefined=undefined ): Client {
    return this.client.addCall( 'd.custom', hash, variable )
  }


  /**
   * Set the value of a custom variable.
   * @param {String} variable       - Name of the variable
   * @param {String} value          - Value for the custom variable
   * @param {String|undefined} hash - Hash of torrent, undefined if a sub call
   * @returns {Client}              - Client interface for further chaining
   */
  setCustom( variable: string, value: string, hash: string | undefined=undefined ): Client {
    return this.client.addCall( 'd.custom.set', hash, variable, value );
  }
}

