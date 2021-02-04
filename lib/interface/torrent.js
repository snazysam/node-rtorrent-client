

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

  stop( hash=undefined ) {
    return this.client.addCall( "d.stop", hash );
  }

  start( hash=undefined ) {
    return this.client.addCall( "d.start", hash );
  }

  name( hash=undefined ){
    return this.client.addCall( "d.name", hash );
  }

  setLabel( label, hash=undefined ) {
    return this.client.addCall( "d.custom1.set", hash, label );
  }

  getLabel( hash=undefined ) {
    return this.client.addCall( "d.custom1", hash );
  }
 


}

export default Torrent;

