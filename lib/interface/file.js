

/**
 * File interface class
 * @class
 */
class File {

  constructor( client ) {
    this.client = client;
  }

  multiCall( hash, filter='' ) {
    return this.client.addMultiCall( "f.multicall", hash, filter ); 
  }

  path( hash, index ) {
    return this.client.addCall( 'f.path', hash + ':f' + index );
  }

}

export default File;

