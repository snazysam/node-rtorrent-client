
import Chai from 'chai';

const expect = Chai.expect;

import Deserializer from '../lib/deserializer.js';


describe("Deserializer - ", function() {
  
  describe( "Deserialize", function() {

    it( "All types", function() { 
      const xml = "<?xml version=\"1.0\"?><methodResponse><params><param><value><string></string></value></param><param><value><string>d.custom1.set=\"bar\"</string></value></param><param><value><string><![CDATA[<special>]]></string></value></param><param><value><int>123</int></value></param><param><value><array><data><value><int>123</int></value><value><string>456</string></value></data></array></value></param><param><value><base64>YmFyZm9v</base64></value></param><param><value><dateTime.iso8601>1995-12-16T16:24:00.000Z</dateTime.iso8601></value></param><param><value><struct><member><name>foo</name><value><string>bar</string></value></member><member><name>bar</name><value><string>foo</string></value></member></struct></value></param></params></methodResponse></xml>";
      let buf, date, expected, response;

      buf = Buffer.from( "barfoo" );
      date = new Date( "December 17, 1995 03:24:00" );
      expected = [
        '',
        'd.custom1.set="bar"',
        '<special>',
        123,
        [ 123, "456" ],
        buf,
        date,
        { foo: "bar", bar: "foo" }
      ];

      expect( () => { response = Deserializer.deserialize( xml ) } ).to.not.throw();
      expect( response ).to.deep.equal( expected );
    } );
    
  } );

} );


