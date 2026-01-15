

import {expect} from 'chai';

import { Serializer } from '../lib/serializer.js';


describe("Serializer - ", function() {

  describe( "Serialize", function() {

    it( "All types", function() {
      const expected = "<?xml version=\"1.0\"?><methodCall><methodName>d.foobar</methodName><params><param><value><string></string></value></param><param><value><string>d.custom1.set=\"bar\"</string></value></param><param><value><string><![CDATA[<special>]]></string></value></param><param><value><int>123</int></value></param><param><value><array><data><value><int>123</int></value><value><string>456</string></value></data></array></value></param><param><value><base64>YmFyZm9v</base64></value></param><param><value><dateTime.iso8601>1995-12-16T16:24:00.000Z</dateTime.iso8601></value></param><param><value><struct><member><name>foo</name><value><string>bar</string></value></member><member><name>bar</name><value><string>foo</string></value></member></struct></value></param></params></methodCall>";
      let xml: string='',
      buf: Buffer,
      date: Date,
      method: string,
      params: Array<any>;

      buf = Buffer.from( "barfoo" );
      date = new Date( "December 17, 1995 03:24:00" );

      method = "d.foobar";
      params = [
        '',
        'd.custom1.set="bar"',
        '<special>',
        123,
        [ 123, "456" ],
        buf,
        date,
        { foo: "bar", bar: "foo" }
      ];

      expect( () => { xml = Serializer.serialize( method, params ) } ).to.not.throw();
      expect( xml ).to.equal( expected );
    } );

  } );

} );


