

/**
 * System method interface class
 *
 * See the rTorrent XMLRPC manual for information about methods
 * @class
 */
class System {

  constructor( client ) {
    this.client = client;
  }

  listMethods() {
    return this.client.addCall( 'system.listMethods' );
  }

  apiVersion() {
    return this.client.addCall( 'system.api_version' );
  }

  clientVersion() {
    return this.client.addCall( 'system.client_version' );
  }

  libraryVersion() {
    return this.client.addCall( 'system.library_version' );
  }

  cwd() {
    return this.client.addCall( 'system.cwd' );
  }

  setCwd( directory ) {
    return this.client.addCall( 'system.cwd.set', '', directory );
  }

  env( variableName ) {
    return this.client.addCall( 'system.env', '', variableName );
  }

  fileAllocate() {
    return this.client.addCall( 'system.file.allocate' );
  }

  hostname() {
    return this.client.addCall( 'system.hostname' );
  }

  pid() {
    return this.client.addCall( 'system.pid' );
  }

}

export default System;

