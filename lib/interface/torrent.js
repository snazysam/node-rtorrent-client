

/**
 * Torrent interface class
 * @class
 */
class Torrent {

  constructor( client ) {
    this.client = client;
  }

  multiCall( view='' ) {
    return this.client.addMultiCall( "d.multicall2", '', view ); 
  }

  multiCallFiltered( view='', predicate='' ) {
    // Predicate eg 'equal=d.custom=foo,cat=bar'
    return this.client.addMultiCall( "d.multicall.filtered", '', view, predicate ); 
  }

  stop( hash=undefined ) {
    return this.client.addCall( "d.stop", hash );
  }

  start( hash=undefined ) {
    return this.client.addCall( "d.start", hash );
  }

  hash() {
    return this.client.addSub( 'd.hash' );
  }

  name( hash=undefined ){
    return this.client.addCall( "d.name", hash );
  }

  isMultiFile( hash=undefined ) {
    return this.client.addCall( "d.is_multi_file", hash );
  }

  getDirectory( hash=undefined ) {
    return this.client.addCall( "d.directory", hash );
  }

  setDirectory( directory, hash=undefined ) {
    return this.client.addCall( "d.directory.set", hash, directory );
  }

  setLabel( label, hash=undefined ) {
    return this.client.addCall( "d.custom1.set", hash, label );
  }

  getLabel( hash=undefined ) {
    return this.client.addCall( "d.custom1", hash );
  }
 
  getCustom( variable, hash=undefined ) {
    return this.client.addCall( 'd.custom', hash, variable )
  }

  setCustom( variable, value, hash=undefined ) {
    return this.client.addCall( 'd.custom.set', hash, variable, value );
  }
}

export default Torrent;

