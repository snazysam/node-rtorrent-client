
import { Client } from './dist/client.js';
import { XMLFaultError } from './dist/deserializer.js';

import util from 'util';

import CLA from 'command-line-args';
import CLU from 'command-line-usage';



const optionDefs = [
  { name: "mode",     alias: "m", type: String,  description: "Connection mode, either scgi socket or http" },
  { name: "rpctype",  alias: "r", type: String,  description: "RPC payload type, xml or json" },
  { name: "host",     alias: "h", type: String,  description: "Host name or IP address for HTTP or TCP socket" },
  { name: "port",     alias: "p", type: Number,  description: "Port number for TCP socket or HTTP" },
  { name: "path",     alias: "a", type: String,  description: "HTTP path" },
  { name: "username", alias: "u", type: String,  description: "HTTP username (auth basic only)" },
  { name: "password", alias: "w", type: String,  description: "HTTP password" },
  { name: "socket",   alias: "s", type: String,  description: "Socket path for unix IPC socket", typeLabel: '{underline file}', },
  { name: "ssl",                  type: Boolean, description: "Enable HTTPS" },
  { name: "noverify",             type: Boolean, description: "Disable SSL certificate verification" },
  { name: "help",     alias: "?", type: Boolean, description: "Display this usage information" }
];


const sections = [
  {
    'header': "rTorrent client",
    'content': "Runs remote procedure commands on the rTorrent server"
  },
  {
    'header': "Execution",
    'content': '$ node cli.js [options] -- command param1 param2...'
  },
  {
    'header': "Options",
    'optionList': optionDefs
  }
];


const options = CLA( optionDefs, { stopAtFirstUnknown: true } );
const usage = CLU( sections );
const args = process.argv;
const cmds = args.slice( args.indexOf( '--' ) + 1 );

// Catch any unhandled rejections
process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error.message, error.stack);
});

if ( 'help' in options ) {
  console.log( usage );
  process.exit( 0 );
}
else if ( ! 'mode' in options || ! ( ( 'host' in options && 'port' in options ) || ( 'socket' in options ) ) ) {
  console.log( usage );
  process.exit( 0 );
}
else if ( args.indexOf( '--' ) == -1 ) {
  console.log( "ERROR: Command missing!\n\n" );
  console.log( usage );
  process.exit( 1 );
}

if ( 'noverify' in options ) {
  delete options[ 'noverify' ];
  options[ 'verify' ] = false;
}

const client = new Client( options );

var method = cmds[0];
var params = cmds.slice( 1 );
var result;

try {
  await client.testConnection();
}
catch( e ) {
  console.log( "Connection test failed, aborting. Error: " + e.message );
  process.exit( 1 );
}

try {
  result = await client.send( method, ...params );
}
catch( e ) {
  if ( e instanceof XMLFaultError ) {
    console.log( `Procedure call fault: ${e.faultCode}, ${e.faultString}` );
  }
  else {
    console.log( "Failed request", e );
  }
  process.exit( 1 );
}

if ( Array.isArray( result ) && result.length > 0 )
  console.log( "Result is", util.inspect(result, { maxArrayLength: null } ) );
else
  console.log( "Result is", result );


