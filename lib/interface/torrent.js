

/**
 * Torrent interface class
 * @class
 */
export class TorrentInterface {

  /**
   * Get a new torrent interface instance
   */
  constructor( client ) {
    this.client = client;
  }

  /**
   * Start a multicall query
   * @param {String} view         - View the multicall query operates on
   * @returns {Client}            - Client interface for further chaining
   */
  multiCall( view='' ) {
    return this.client.addMultiCall( "d.multicall2", '', view ); 
  }

  /**
   * Start a multicall query with a filter
   * @param {String} view         - View the multicall query operates on
   * @param {String} predicate    - The predicate string sub-command, eg 'equal=d.custom=foo,cat=bar'
   * @returns {Client}            - Client interface for further chaining
   */
  multiCallFiltered( view='', predicate='' ) {
    return this.client.addMultiCall( "d.multicall.filtered", '', view, predicate ); 
  }


  /**
   * Stop one torrent
   * @param {String} hash         - Hash of torrent to stop
   * @returns {Client}            - Client interface for further chaining
   */
  stop( hash=undefined ) {
    return this.client.addCall( "d.stop", hash );
  }

  /**
   * Start one torrent
   * @param {String} hash         - Hash of torrent to start
   * @returns {Client}            - Client interface for further chaining
   */
  start( hash=undefined ) {
    return this.client.addCall( "d.start", hash );
  }


  /**
   * Load one torrent
   * @param {String|Buffer} thing - Buffer or URL
   * @param {Boolean} start       - Whether to start the torrent on load
   * @returns {Client}            - Client interface for further chaining
   */
  load( thing=undefined, start=false ) {
    const buf = Buffer.isBuffer( thing );
    let method, param;
    if ( buf && start )
      method = 'load.raw_start';
    else if ( buf )
      method = 'load.raw';
    else if ( start )
      method = 'load.start';
    else
      method = 'load.normal';

    if ( buf )
      param = thing.toString( 'base64' );
    else
      param = thing;
    return this.client.addMultiCall( method, '', param );
  }


  /**
   * Get the hash for a chained torrent. Adds the hash to outputs
   * @returns {Client}            - Client interface for further chaining
   */
  hash() {
    return this.client.addSub( 'd.hash' );
  }


  /**
   * Get the name for a torrent. Adds a numeric boolean to outputs
   * @param {String} hash         - Hash of torrent
   * @returns {Client}            - Client interface for further chaining
   */
  name( hash=undefined ){
    return this.client.addCall( "d.name", hash );
  }


  /**
   * Check if torrent is multi-file or not. Adds a numeric boolean to outputs
   * @param {String} hash         - Hash of torrent
   * @returns {Client}            - Client interface for further chaining
   */
  isMultiFile( hash=undefined ) {
    return this.client.addCall( "d.is_multi_file", hash );
  }


  /**
   * Get the current download directory of a torrent. Adds the path to outputs
   * @param {String} hash         - Hash of torrent
   * @returns {Client}            - Client interface for further chaining
   */
  getDirectory( hash=undefined ) {
    return this.client.addCall( "d.directory", hash );
  }


  /**
   * Set the current download directory of a torrent.
   * @param {String} directory    - Desired directory
   * @param {String} hash         - Hash of torrent
   * @returns {Client}            - Client interface for further chaining
   */
  setDirectory( directory, hash=undefined ) {
    return this.client.addCall( "d.directory.set", hash, directory );
  }


  /**
   * Set the current label of a torrent.
   * @param {String} label        - Desired label
   * @param {String} hash         - Hash of torrent
   * @returns {Client}            - Client interface for further chaining
   */
  setLabel( label, hash=undefined ) {
    return this.client.addCall( "d.custom1.set", hash, label );
  }


  /**
   * Get the current label of a torrent. Adds the label to outputs
   * @param {String} hash         - Hash of torrent
   * @returns {Client}            - Client interface for further chaining
   */
  getLabel( hash=undefined ) {
    return this.client.addCall( "d.custom1", hash );
  }


  /**
   * Get the value of a custom variable. Adds the value to outputs
   * @param {String} variable     - Name of the variable
   * @param {String} hash         - Hash of torrent
   * @returns {Client}            - Client interface for further chaining
   */
  getCustom( variable, hash=undefined ) {
    return this.client.addCall( 'd.custom', hash, variable )
  }


  /**
   * Set the value of a custom variable.
   * @param {String} variable     - Name of the variable
   * @param {String} value        - Value for the custom variable
   * @param {String} hash         - Hash of torrent
   * @returns {Client}            - Client interface for further chaining
   */
  setCustom( variable, value, hash=undefined ) {
    return this.client.addCall( 'd.custom.set', hash, variable, value );
  }
}

