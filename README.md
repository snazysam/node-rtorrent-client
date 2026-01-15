# node-rtorrent-client

A versatile NodeJS rTorrent client which can utilise SCGI via unix or TCP sockets, or HTTP(s) implementing JSONRPC or XMLRPC.

# Description

A brand new, easy to use rTorrent client for NodeJS applications, providing asynchronous communication with a rTorrent server via direct SCGI (socket or TCP) connection, or via HTTP(s). Both XMLRPC and JSONRPC are supported.

# Installation

`npm install node-rtorrent-client`

# Breaking changes

Note, the update to 0.3.0 has a breaking change to the client interface required to reflect updates to rTorrent. Apologies for this. I endevor to keep breaking changes will be kept to a minimum.

# Usage

```
import { Client } from 'node-rtorrent-client'

const options = {
  mode        : "scgi",                        /* Either scgi or http */
  rpctype     : "xml",                         /* RPC payload type, xml or json */
  socket      : "/path/to/rtorrent.sock",      /* If utilising socket */
  host        : "hostname",                    /* IP address or hostname for SCGI(TCP) or HTTP */
  port        : 1234,                          /* TCP port number for either SCGI(TCP) or HTTP */
  path        : "/RPC2",                       /* HTTP path */
  ssl         : true,                          /* Enable or disable SSL for HTTP */
  verify      : true,                          /* Enable or disable SSL certificate verification for HTTP */
  username    : "username",                    /* Username and password if require for XMLRPC */
  password    : "password"
};

/* Get a new client */
const client = new Client( options );

/* Test the connection */
await client.testConnection();

/* Send returns a promise, so either await or resolve else ways */
let methods = await client.system.listMethods()
    .send();

/* Stop all active torrents through chaining commands */
await client.torrent.multicall( 'active' )
    .torrent.stop()
    .send();

/* Get the name, hash and label for all torrents */
let result = await client.torrent.multiCall()
    .torrent.name()
    .torrent.hash()
    .torrent.getLabel()
    .send();

/*
  Responses make sense. Eg:
  result = [
    [ 'name1', 'hash1', 'label1' ],
    [ 'name2', 'hash2', 'label2' ],
    ...
  ];
*/

/* Set a label */
await client.torrent.setLabel( 'foobar', 'hashoftorrent' )
    .send();

/* Start one torrent */
await client.torrent.start( 'hashoftorrent' )
    .send();
```

**More to come**

# CLI

The included cli.js script can be used for direct CLI access to rTorrent without being restricted to the interface.

For usage information, execute:

```
node cli.js --help
```

That should yield something like this:

```
rTorrent client

  Runs remote procedure commands on the rTorrent server

Execution

  $ node cli.js [options] -- command param1 param2...

Options

  -m, --mode string       Connection mode, either scgi socket or http
  -r, --rpctype string    RPC payload type, xml or json
  -h, --host string       Host name or IP address for HTTP or TCP socket
  -p, --port number       Port number for TCP socket or HTTP
  -a, --path string       HTTP path
  -u, --username string   HTTP username (auth basic only)
  -w, --password string   HTTP password
  -s, --socket file       Socket path for unix IPC socket
  --ssl                   Enable HTTPS
  --noverify              Disable SSL certificate verification
  -?, --help              Display this usage information
```

Examples:

```
# To get the client version using XML over HTTP:
node cli.js -m http -r xml -h 10.1.2.3 -p 8080 -u username -w password -a /RPC2 -- system.client_version

# To list all methods available via SCGI socket (listMethods only functions using XML):
node cli.js -m scgi -r xml -s /tmp/rtorrent.sock -- system.listMethods

# To fetch the hash and label for each active torrent using JSON via SCGI:
node cli.js -m scgi -r json -h 10.1.2.3 -p 8080 -- d.multicall2 '' active d.hash= d.custom1=
```

Refer to rTorrent XMLRPC manual for more information about commands.

# Support

This software is likely full of bugs. Parts of it are completely untested. Please feel free to contribute with pull requests.

# Acknowledgments

XML encoding / decoding inspired by @kinabcd (node-rtorrent-scgi)

# License

ISC, refer to LICENSE.txt


