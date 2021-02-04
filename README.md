# node-rtorrent-client

A versatile NodeJS rTorrent client which can utilise SCGI and XMLRPC via HTTP and HTTPS.

# Description

A brand new, easy to use rTorrent client for NodeJS applications, written using ECMAScript for asynchronous communication with a rTorrent server via direct SCGI (socket or TCP), or XMLRPC (HTTP or HTTPS), supporting authentication. 

# Installation

`npm install node-rtorrent-client`

# Usage

For CJS and ECMAScript applications:

```
import Client from 'node-rtorrent-client'

const options = {
  mode        : scgi,                          /* Either xmlrpc or scgi (default) */
  socket      : "/path/to/rtorrent.sock",      /* If utilising socket */
  host        : "hostname",                    /* IP address or hostname for SCGI(TCP) or XMLRPC */
  port        : 1234,                          /* TCP port number for either SCGI(TCP) or XMLRPC */
  ssl         : true,                          /* Enable or disable SSL for XMLRPC */
  username    : "username",                    /* Username and password if require for XMLRPC */
  password    : "password"
};

/* Get a new client */
const client = new Client( options );

/* Test the connection */
await client.testConnection();

/* Send returns a promise, so either await or resolve else ways */
var methods = await client.system.listMethods()
    .send();

/* Stop all active torrents through chaining commands */
await client.torrent.multicall( 'active' )
    .torrent.stop()
    .send();

/* Get the name, hash and label for all torrents */
var result = await client.torrent.multicall()
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

# Support

This software is likely full of bugs. You're welcome to fork or raise issues, and are encouraged to contribute with pull requests.

# Acknowledgments

XML encoding / decoding inspired by @kinabcd (node-rtorrent-scgi)

# License

ISC, refer to LICENSE.txt


