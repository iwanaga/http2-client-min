var net = require('net');

var CONF = require('./conf/conf.json');

console.log(CONF.dst);

var MagicOctet = new Buffer('PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n', 'ascii');
console.log(MagicOctet);

// R: 00 (2 bit)
// Payload Length: 0 (14 bit)
// R + Length: [0x0, 0x0]
// Type: 0x4 (8 bit)
var FrameType = {
    DATA         : 0x0,
    HEADERS      : 0x1,
    PRIORITY     : 0x2,
    RST_STREAM   : 0x3,
    SETTINGS     : 0x4,
    PUSH_PROMISE : 0x5,
    PING         : 0x6,
    GOAWAY       : 0x7,
    WINDOW_UPDATE: 0x8,
    CONTINUATION : 0x9
};
console.log(new Buffer([FrameType.SETTINGS]));

var initialSettingFrame = Buffer([0x0, 0x0, FrameType.SETTINGS, 0x0,
				  0x0, 0x0, 0x0, 0x0]);

var headers = new Buffer([0x0, 0x?, FrameType.HEADERS, 0x0,
			  0x0, 0x0, 0x0, 0x1
]);

var headersPayload = new Buffer([0x0, 0x0, 0x0, 0x0]);

var sock = net.Socket({
    allwoHalfOepn: true,
    readable: true,
    writable: true
});

sock.connect(CONF.port, CONF.host, function(){
    sock.on('error', function(err){
        console.log(err);
    });
    sock.on('close', function(){
        console.log('closed');
    });
    sock.on('data', function(data){
        console.log('response');
        console.log(data);
        //sock.write(Buffer.concat([]));
    });
    console.log('sending: Magic Octet + SETTINGS Frame');
    sock.write(Buffer.concat([MagicOctet, initialSettingFrame]));
});
