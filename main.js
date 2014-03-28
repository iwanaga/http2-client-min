"use strict";

var net            = require('net');
var Http2          = require('./lib/http2');
var Http2Response  = require('./lib/http2response');
var CONF           = require('./conf/conf.json');
var StreamConf = {
    ready: false,
    nextStreamId: 0x1
};

function StreamHandler(sock) {
    var self = this;
    this.socket = sock;
    this.dataBuff = new Buffer(0);

    this.handleData = function(data){
        console.log('data.length: ', data.length);
        self.appendData(data);
        self.handleFrontFrame();
    };

    this.handleFrontFrame = function() {
        if ( self.hasFrameHeader() ) {
            var response = new Http2Response(self.dataBuff);
            response.setFrameHeader(self.dataBuff.slice(0, Http2.FrameHeaderSize));
            if ( self.hasPayload(self.dataBuff) ) {
                response.setPayload(self.getPayload(self.dataBuff), function(){
                    if (response.sendBuff.length > 0) {
                        self.socket.write(response.sendBuff);
                        console.log('[debug] sent SETTING ACK');
                        response.sendBuff = new Buffer(0);
                    }
                    self.shiftBuffer(response.responseSize);
                    if (self.dataBuff.length > 0) {
                        console.log('[debug] after shift: ', self.dataBuff);
                        console.log('[debug] handling next data.');
                        self.handleFrontFrame();
                    } else if (response.sendACK) {
                        // Todo: use sendBuff
                        console.log('[debug] established http2 session!!');
                        self.socket.write(headersFrame);
                        console.log('[debug] sent request');
                        response.sendACK = false;
                    }
                });
            }
        }
    };
}
StreamHandler.prototype.setData = function(data) {
    this.dataBuff = data;
};
StreamHandler.prototype.appendData = function(data) {
    this.dataBuff = Buffer.concat([this.dataBuff, data]);
};
StreamHandler.prototype.hasFrameHeader = function() {
    return (this.dataBuff.length > 7);
};
StreamHandler.prototype.hasPayload = function() {
    return ( this.dataBuff.length >= Http2.FrameHeaderSize + this.getPayloadSize() );
};
StreamHandler.prototype.getPayloadSize = function() {
    return this.dataBuff.readUInt16BE(0);
};
StreamHandler.prototype.getPayload = function() {
    return this.dataBuff.slice(Http2.FrameHeaderSize, Http2.FrameHeaderSize + this.getPayloadSize());
};
StreamHandler.prototype.hasNextData = function(responseSize) {
    console.log(this.dataBuff.length, responseSize);
    return (this.dataBuff.length > responseSize);
}
StreamHandler.prototype.shiftBuffer = function(size) {
    var newBuff = new Buffer(this.dataBuff.length - size);
    this.dataBuff.copy(newBuff, 0, size, this.dataBuff.length);
    this.dataBuff = newBuff;
};


var initialSettingFrame = Buffer([0x0, 0x0, Http2.FrameType.SETTINGS, 0x0,
				  0x0, 0x0, 0x0, 0x0]);

// HEADERS Frame
var requestHeaders = [
    { key: ':method',    val: 'GET' },
    { key: ':scheme',    val: CONF.schema },
    { key: ':path',      val: '/' },
    { key: ':authority', val: CONF.host + ':' + CONF.port.toString() },
    { key: 'user-agent', val: '@y_iwanaga_' }
];

var headerFrameLen = 0;
var streamId = 0x1;
var HeaderFlag = {
    END_STREAM : 0x1,
    RESERVED   : 0x2,
    END_HEADERS: 0x4,
    PRIORITY   : 0x8
};

var frameHeader = [0x0, headerFrameLen,
                   Http2.FrameType.HEADERS,
                   HeaderFlag.END_HEADERS | HeaderFlag.END_STREAM,
		   0x0, 0x0, 0x0, streamId];
var priority = [0x0, 0x0, 0x0, 0x0];
var literalWithoutIndex = parseInt('01000000', 2);
var headerBlock = [];
for (var i = 0; i < requestHeaders.length; i++) {
    headerBlock.push(literalWithoutIndex);
    headerBlock.push(requestHeaders[i].key.length);
    for (var j = 0; j < requestHeaders[i].key.length; j++) {
        headerBlock.push(requestHeaders[i].key.charCodeAt(j));
    }
    headerBlock.push(requestHeaders[i].val.length);
    for (var j = 0; j < requestHeaders[i].val.length; j++) {
        headerBlock.push(requestHeaders[i].val.charCodeAt(j));
    }
}
var hasPriorityFlag = false;
var framePayload = [];
if (hasPriorityFlag) {
    framePayload = priority;
}
framePayload = framePayload.concat(headerBlock);

headerFrameLen = framePayload.length;
frameHeader[1] = headerFrameLen;
var headersFrame = new Buffer([]
			      .concat(frameHeader)
			      .concat(framePayload));

// main
var sock = net.Socket({
    allwoHalfOepn: true,
    readable: true,
    writable: true
});

sock.connect(CONF.port, CONF.host, function(){
    var stream = new StreamHandler(sock);
    sock.on('error', function(err){
        console.log(err);
    });
    sock.on('close', function(){
        console.log('closed');
        sock.destroy();
    });
    sock.on('data', stream.handleData);

    console.log('sending: Magic Octet + SETTINGS Frame');
    sock.write(Buffer.concat([Http2.MagicOctet, initialSettingFrame]));
});
