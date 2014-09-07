"use strict";

var net            = require('net');
var Http2          = require('./lib/http2constant');
var StreamHandler  = require('./lib/http2stream');
var CONF           = require('./conf/conf.json');

/**
 *  main
 */
var requestHeaders = [
    { key: ':method',    val: 'GET' },
    { key: ':scheme',    val: CONF.schema },
    { key: ':path',      val: '/' },
    { key: ':authority', val: CONF.host + ':' + CONF.port.toString() },
    { key: 'user-agent', val: '@y_iwanaga_' }
];

// Todo: refactor...
var initialSettingFrame = new Buffer([
    0x0, 0x0, Http2.FrameType.SETTINGS, 0x0,
    0x0, 0x0, 0x0, 0x0
]);

var sock = net.Socket({
    allwoHalfOepn: true,
    readable: true,
    writable: true
});

sock.connect(CONF.port, CONF.host, function(){
    var stream = new StreamHandler(sock);
    stream.setRequest(requestHeaders);

    sock.on('error', function(err){
        console.log(err);
    });
    sock.on('close', function(){
        console.log('[debug] closed');
        sock.destroy();
    });
    sock.on('data', stream.handleData);

    console.log('[debug] sending: Magic Octet + SETTINGS Frame');
    sock.write(Buffer.concat([Http2.MagicOctet, initialSettingFrame]));
});
