

import http from 'node:http';
import net from 'node:net';


type Mode = "sgci_socket" | "scgi_tcp" | "http";


const XMLUnknownAnswer = `<?xml version="1.0" encoding="UTF-8"?><methodResponse><fault><value><struct><member><name>faultCode</name><value><i4>-506</i4></value></member><member><name>faultString</name><value><string>Method not defined</string></value></member></struct></value></fault></methodResponse>`;

const JSONUnknownAnswer = '{"error":{"code":-32601,"message":"method not found: something"},"id":1234,"jsonrpc":"2.0"}';


const XMLAnswers: {[index:string]:any} = {
  '<?xml version="1.0"?><methodCall><methodName>system.api_version</methodName><params><param><value/></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>18</string></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>system.client_version</methodName><params><param><value/></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>0.16.5</string></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>system.cwd</methodName><params><param><value/></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>/foo/bar</string></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>system.library_version</methodName><params><param><value/></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>0.16.5</string></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>system.pid</methodName><params><param><value/></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><i8>1234</i8></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>system.env</methodName><params><param><value><string></string></value></param><param><value><string>PATH</string></value></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin</string></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>f.path</methodName><params><param><value><string>AAAA:f0</string></value></param></params></methodCall>':'<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>Debian-12.3.0-amd64.iso</string></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>f.multicall</methodName><params><param><value><string>BBBB</string></value></param><param><value><string></string></value></param><param><value><string>f.path=</string></value></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><array><data><value><array><data><value><string>abcd</string></value></data></array></value><value><array><data><value><string>efgh</string></value></data></array></value></data></array></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>d.stop</methodName><params><param><value><string>AAAA</string></value></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><i4>0</i4></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>d.start</methodName><params><param><value><string>AAAA</string></value></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><i4>0</i4></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>d.name</methodName><params><param><value><string>CCCC</string></value></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>Foo Bar</string></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>d.is_multi_file</methodName><params><param><value><string>CCCC</string></value></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><i8>1</i8></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>d.directory</methodName><params><param><value><string>CCCC</string></value></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>/Foo/Bar</string></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>d.custom2.set</methodName><params><param><value><string>CCCC</string></value></param><param><value><string>else</string></value></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>else</string></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>d.custom2</methodName><params><param><value><string>CCCC</string></value></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>something</string></value></param></params></methodResponse>',
  '<?xml version="1.0"?><methodCall><methodName>load.start</methodName><params><param><value><string></string></value></param><param><value><string>https://cdimage.debian.org/debian-cd/current/amd64/bt-cd/debian-12.3.0-amd64-netinst.iso.torrent</string></value></param><param><value><string>d.custom1.set=Something</string></value></param></params></methodCall>': '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><i4>0</i4></value></param></params></methodResponse>',
};


const JSONAnswers: {[index:string]:any} = {
  '{"jsonrpc":"2.0","method":"system.api_version","params":[],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":"18"}',
  '{"jsonrpc":"2.0","method":"system.client_version","params":[],"id":1234}':'{"id":1234,"jsonrpc":"2.0","result":"0.16.5"}',
  '{"jsonrpc":"2.0","method":"system.library_version","params":[],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":"0.16.5"}',
  '{"jsonrpc":"2.0","method":"system.cwd","params":[],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":"/foo/bar"}',
  '{"jsonrpc":"2.0","method":"system.pid","params":[],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":1234}',
  '{"jsonrpc":"2.0","method":"system.env","params":["","PATH"],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":"/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"}',
  '{"jsonrpc":"2.0","method":"f.path","params":["AAAA:f0"],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":"debian-12.3.0-amd64.iso"}',
  '{"jsonrpc":"2.0","method":"f.multicall","params":["BBBB","","f.path="],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":[["abcd"],["efgh"]]}',
  '{"jsonrpc":"2.0","method":"d.name","params":["CCCC"],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":"Foo Bar"}',
  '{"jsonrpc":"2.0","method":"d.is_multi_file","params":["CCCC"],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":1}',
  '{"jsonrpc":"2.0","method":"d.directory","params":["CCCC"],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":"/Foo/Bar"}',
  '{"jsonrpc":"2.0","method":"d.custom2","params":["CCCC"],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":"something"}',
  '{"jsonrpc":"2.0","method":"d.custom2.set","params":["CCCC","else"],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":"else"}',
  '{"jsonrpc":"2.0","method":"d.start","params":["AAAA"],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":0}',
  '{"jsonrpc":"2.0","method":"d.stop","params":["AAAA"],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":0}',
  '{"jsonrpc":"2.0","method":"load.start","params":["","https://cdimage.debian.org/debian-cd/current/amd64/bt-cd/debian-12.3.0-amd64-netinst.iso.torrent","d.custom1.set=Something"],"id":1234}': '{"id":1234,"jsonrpc":"2.0","result":0}',
};




export default class MockRTorrent {

  private httpServ!: http.Server;
  private ipcServ!: net.Server;
  private rpcLang: string;

  public authUser: string = "test";
  public authPass: string = "password";


  constructor( mode: Mode, lang: string, port: number, socket: string ) {

    if ( lang !== 'xml' && lang !== 'json' )
      throw new Error( "Unknown RPC language " + lang );

    this.rpcLang = lang;

    this.setupServer( mode, port, socket );

  }


  public finish() {
    if ( this.httpServ )
      this.httpServ.close();
    else if ( this.ipcServ )
      this.ipcServ.close();
  }


  private setupServer( mode: Mode, port: number, socket: string ) {

    if ( mode == "sgci_socket" ) {
      this.ipcServ = net.createServer( (sock: net.Socket) => this.scgiAnswer( sock ) );
      this.ipcServ.listen( socket );
    }
    else if ( mode == "scgi_tcp" ) {
      this.ipcServ = net.createServer( (sock: net.Socket) => this.scgiAnswer( sock ) );
      this.ipcServ.listen( port, '127.0.0.1' );
    }
    else if ( mode == "http" ) {
      if ( ! port )
        throw new Error( "Port required" );
      this.httpServ = http.createServer( (req, res) => this.httpAnswer( req, res ) );
      this.httpServ.listen( port );
    }

  }



  private httpAnswer( req: http.IncomingMessage, res: http.ServerResponse ) {
    let wantAuth = "Basic " + btoa( this.authUser + ":" + this.authPass );

    if ( ! req.headers.authorization || req.headers.authorization !== wantAuth ) {
      res.statusCode = 401;
      res.statusMessage = "Unauthorized";
      res.end();
    }
  }



  private scgiAnswer( sock: net.Socket ) {
    let message: string;
    let response: string;
    let answers: {[index:string]:any};
    let unk: string;
    let tmpid: RegExpMatchArray | null;

    if ( this.rpcLang == "xml" ) {
      answers = XMLAnswers;
      unk = XMLUnknownAnswer;
    }
    else if ( this.rpcLang == "json" ) {
      answers = JSONAnswers;
      unk = JSONUnknownAnswer;
    }
    else
      throw new Error( "Unkown RPC language" );

    sock.on( 'data', (data) => {
      let req: string = data.toString();
      message = this.parseSCGI( req );

      // Replace ID with something known
      if ( this.rpcLang == "json" ) {
        tmpid = message.match( /"id":(?<id>[0-9]+)/ );
        message = message.replace( new RegExp( "\"id\":[0-9]*" ), "\"id\":1234")
      }

      response = answers[ message ] || unk;

      // Replace original ID
      if ( this.rpcLang == "json" && tmpid !== null ) {
        response = response.replace( /"id":1234/, "\"id\":" + tmpid.groups?.id );
      }

      sock.write( response );
      sock.end();
    } );
  }


  private parseSCGI( request: string ) {
    let body: string;
    let bodymark: string = ".";

    if ( this.rpcLang == "xml" )
      bodymark = '<';
    else if ( this.rpcLang == "json" )
      bodymark = '{';

    body = request.slice( request.indexOf( bodymark ) );

    return body;
  }

}

