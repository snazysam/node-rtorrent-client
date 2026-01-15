
import MockRTorrent from "./lib/mockrtorrent.js";

import { Client } from "../lib/client.js";

import {expect} from 'chai';
import assert from 'assert'

import * as Conn from "../lib/connection.js";
// @ts-ignore: Node 22+ failure with non-default interface import


let server: MockRTorrent;
let client: Client;

const XMLConfig: Conn.ConnectionConfig = {
  'mode': 'scgi',
  'socket': '/tmp/mockrtorrent.sock',
  'rpctype': 'xml',
};

const JSONConfig: Conn.ConnectionConfig = {
  'mode': 'scgi',
  'socket': '/tmp/mockrtorrent.sock',
  'rpctype': 'json',
};



describe( "XML Communication", () => {


  before( () => {

    server = new MockRTorrent( 'sgci_socket', 'xml', 1, '/tmp/mockrtorrent.sock' );

  } );


  after( () => {
    server.finish();
  } );


  it( "Test server", () => {

    assert( server && server instanceof MockRTorrent );

  } );


  it( "Test client", () => {
    client = new Client( XMLConfig );
    assert( client instanceof Client );
  } );

  describe( "System", () => {

    it( "Connection test", async () => {
      assert( await client.testConnection() );
    } );


    it( "API version", async () => {
      let ver = await client.system.apiVersion().send();
      assert( ver == "18" );
    } );


    it( "Client version", async () => {
      let ver = await client.system.clientVersion().send();
      assert( ver == "0.16.5" );
    } );


    it( "Library version", async () => {
      let ver = await client.system.libraryVersion().send();
      assert( ver == "0.16.5" );
    } );


    it( "CWD", async () => {
      let dir = await client.system.cwd().send();
      assert( dir == "/foo/bar" );
    } );


    it( "PID", async () => {
      let dir = await client.system.pid().send();
      assert( dir == "1234" );
    } );


    it( "Environment variable", async () => {
      let path = await client.system.env( 'PATH' ).send();
      assert( path == "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" );
    } );

  } );

  describe( "File", () => {

    it( "Get path", async () => {
      let path = await client.file.getPath( 'AAAA', 0 ).send();
      assert( path == "Debian-12.3.0-amd64.iso" );
    } );


    it( "Get all paths", async () => {
      let paths = await client.file.multiCall( 'BBBB' ).file.subPath().send();
      assert( paths.length );
      assert( paths[0] == "abcd" );
      assert( paths[1] == "efgh" );
    } );

  } );

  describe( "Torrent", () => {

    it( "Name", async () => {
      let name = await client.torrent.name( 'CCCC' ).send();
      assert( name == 'Foo Bar' );
    } );

    it( "Is mutli file", async () => {
      let multi = await client.torrent.isMultiFile( 'CCCC' ).send();
      assert( multi == 1 );
    } );

    it( "Directory", async () => {
      let dir = await client.torrent.getDirectory( 'CCCC' ).send();
      assert( dir == '/Foo/Bar' );
    } );

    it( "Numbered Custom Variable", async () => {
      let val = await client.torrent.getCustomN( 2, 'CCCC' ).send();
      assert( val == 'something' );
    } );

    it( "Numbered Custom Variable Set", async () => {
      let val = await client.torrent.setCustomN( 2, 'else', 'CCCC').send();
      assert( val == 'else' );
    } );

    it( "Start", async () => {
      let res = await client.torrent.start( 'AAAA' ).send();
      assert( res == 0 );
    } );

    it( "Stop", async () => {
      let res = await client.torrent.stop( 'AAAA' ).send();
      assert( res == 0 );
    } );

    it( 'Load & label', async () => {
      let res = await client.torrent.load( 'https://cdimage.debian.org/debian-cd/current/amd64/bt-cd/debian-12.3.0-amd64-netinst.iso.torrent', true ).torrent.setLabel( 'Something' ).send();
      assert( res == 0 );
    } );

  } );

} );


describe( "JSON Communication", () => {

  before( () => {
    server = new MockRTorrent( 'sgci_socket', 'json', 1, '/tmp/mockrtorrent.sock' );
  } );


  after( () => {
    server.finish();
  } );


  it( "Test server", () => {
    assert( server && server instanceof MockRTorrent );
  } );


  it( "Test client", () => {
    client = new Client( JSONConfig );
    assert( client instanceof Client );
  } );

  describe( "System", () => {

    it( "Connection test", async () => {
      assert( await client.testConnection() );
    } );


    it( "API version", async () => {
      let ver = await client.system.apiVersion().send();
      assert( ver == "18" );
    } );


    it( "Client version", async () => {
      let ver = await client.system.clientVersion().send();
      assert( ver == "0.16.5" );
    } );


    it( "Library version", async () => {
      let ver = await client.system.libraryVersion().send();
      assert( ver == "0.16.5" );
    } );


    it( "CWD", async () => {
      let dir = await client.system.cwd().send();
      assert( dir == "/foo/bar" );
    } );


    it( "PID", async () => {
      let dir = await client.system.pid().send();
      assert( dir == "1234" );
    } );


    it( "Environment variable", async () => {
      let path = await client.system.env( 'PATH' ).send();
      assert( path == "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" );
    } );

  } );

  describe( "File", () => {

    it( "Get path", async () => {
      let path = await client.file.getPath( 'AAAA', 0 ).send();
      assert( path == "debian-12.3.0-amd64.iso" );
    } );


    it( "Get all paths", async () => {
      let paths = await client.file.multiCall( 'BBBB' ).file.subPath().send();
      assert( paths.length );
      assert( paths[0] == "abcd" );
      assert( paths[1] == "efgh" );
    } );

  } );

  describe( "Torrent", () => {

    it( "Name", async () => {
      let name = await client.torrent.name( 'CCCC' ).send();
      assert( name == 'Foo Bar' );
    } );

    it( "Is mutli file", async () => {
      let multi = await client.torrent.isMultiFile( 'CCCC' ).send();
      assert( multi == 1 );
    } );

    it( "Directory", async () => {
      let dir = await client.torrent.getDirectory( 'CCCC' ).send();
      assert( dir == '/Foo/Bar' );
    } );

    it( "Numbered Custom Variable", async () => {
      let val = await client.torrent.getCustomN( 2, 'CCCC' ).send();
      assert( val == 'something' );
    } );

    it( "Numbered Custom Variable Set", async () => {
      let val = await client.torrent.setCustomN( 2, 'else', 'CCCC').send();
      assert( val == 'else' );
    } );

    it( "Start", async () => {
      let res = await client.torrent.start( 'AAAA' ).send();
      assert( res == 0 );
    } );

    it( "Stop", async () => {
      let res = await client.torrent.stop( 'AAAA' ).send();
      assert( res == 0 );
    } );

    it( 'Load & label', async () => {
      let res = await client.torrent.load( 'https://cdimage.debian.org/debian-cd/current/amd64/bt-cd/debian-12.3.0-amd64-netinst.iso.torrent', true ).torrent.setLabel( 'Something' ).send();
      assert( res == 0 );
    } );

  } );



} );

