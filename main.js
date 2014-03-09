"use strict";

var net = require('net');

var CONF = require('./conf/conf.json');
var FrameHeaderSize = 8;
var SettingSize = 8;
var SettingReservedSize = 1;
var SettingIdentifierSize = 3;
var SettingValueSize = 4;
var MagicOctet = new Buffer('PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n', 'ascii');
var StreamConf = {
    ready: false
};

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
var Frame = ['DATA', 'HEADERS', 'PRIORITY', 'RST_STREAM', 'SETTINGS',
             'PUSH_PROMISE', 'PING', 'GOAWAY', 'WINDOW_UPDATE', 'CONTINUATION'];

var SettingIdentifier = {
    '1' : 'SETTINGS_HEADER_TABLE_SIZE',
    '2' : 'SETTINGS_ENABLE_PUSH',
    '4' : 'SETTINGS_MAX_CONCURRENT_STREAMS',
    '7' : 'SETTINGS_INITIAL_WINDOW_SIZE',
    '10': 'SETTINGS_FLOW_CONTROL_OPTIONS'
};

function Http2Response(data){
    this.frameHeader = null;
    this.payloadBuff = null;
    this.responseSize = 0;
}

Http2Response.prototype.setFrameHeader = function(buffer) {
    this.frameHeader = {
        size     : buffer.readUInt16BE(0),
        type     : Frame[buffer.readUInt8(2)],
        flag     : buffer.readUInt8(3),
        streamId : buffer.readUInt32BE(4)
    };
};

Http2Response.prototype.setPayload = function(payload, callback) {
    this.payloadBuff = payload;
    this.responseSize = FrameHeaderSize + this.frameHeader.size;
    console.log(this);
    this[this.frameHeader.type]();

    callback && callback();
};

Http2Response.prototype.getNumberOfSettings = function() {
    return (this.frameHeader.size / 8);
};

Http2Response.prototype.setStreamConf = function(setting) {
    StreamConf[setting[0]] = setting[1];
};

/**
 * @ret [String: key, Number: value]
 */
Http2Response.prototype.getSetting = function(setting) {
    return [
        SettingIdentifier[readUInt24BE(setting.slice(SettingReservedSize, SettingReservedSize + SettingIdentifierSize))],
        setting.slice(SettingReservedSize + SettingIdentifierSize, setting.length).readUInt32BE(0)
    ];
};

/**
 * Frame Handlers
 */
Http2Response.prototype.SETTINGS = function() {
    if ( this.isACK() ) {
        StreamConf.ready = true;
    }
    for (var i = 0, n = this.getNumberOfSettings(); i < n; i++) {
        this.setStreamConf(this.getSetting(this.payloadBuff.slice(i * SettingSize, (i + 1) * SettingSize)));
    }
    console.log(StreamConf);
};
Http2Response.prototype.isACK = function() {
    return (this.frameHeader.flag === 0x1);
};
Http2Response.prototype.DATA = function() {
    console.log(this.payloadBuff);
};

Http2Response.prototype.frameHander = {
    HEADERS: function(){},
    PRIORITY: function(){},
    RST_STREAM: function(){},
    PUSH_PROMISE: function(){},
    PING: function(){},
    GOAWAY: function(){},
    WINDOW_UPDATE: function(){},
    CONTINUATION: function(){}
};

function StreamHandler() {
    var self = this;
    this.dataBuff = new Buffer(0);

    this.handleData = function(data){
        console.log('data.length: ', data.length);
        self.appendData(data);
        self.handleFrontFrame();
    };

    this.handleFrontFrame = function() {
        if ( self.hasFrameHeader() ) {
            var response = new Http2Response(self.dataBuff);
            response.setFrameHeader(self.dataBuff.slice(0, FrameHeaderSize));
            if ( self.hasPayload(self.dataBuff) ) {
                response.setPayload(self.getPayload(self.dataBuff), function(){
                    self.shiftBuffer(response.responseSize);
                    if (self.dataBuff.length > 0) {
                        console.log('after shift: ', self.dataBuff);
                        console.log('handling next data.');
                        self.handleFrontFrame();
                    } else if (StreamConf.ready) {
                        console.log('established http2 session!!');
                        //sock.write(Buffer.concat([]));
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
    return ( this.dataBuff.length >= FrameHeaderSize + this.getPayloadSize() );
};
StreamHandler.prototype.getPayloadSize = function() {
    return this.dataBuff.readUInt16BE(0);
};
StreamHandler.prototype.getPayload = function() {
    return this.dataBuff.slice(FrameHeaderSize, FrameHeaderSize + this.getPayloadSize());
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


/* utility functions */
function readUInt24BE(buffer) {
    return (buffer[0] << 16 | buffer[1] << 8 | buffer [2]);
}

var initialSettingFrame = Buffer([0x0, 0x0, FrameType.SETTINGS, 0x0,
				  0x0, 0x0, 0x0, 0x0]);

var headersPayload = new Buffer([0x0, 0x0, 0x0, 0x0]);

//var headers = new Buffer([0x0, 0x?, FrameType.HEADERS, 0x0,
//			  0x0, 0x0, 0x0, 0x1
//]);

var sock = net.Socket({
    allwoHalfOepn: true,
    readable: true,
    writable: true
});

sock.connect(CONF.port, CONF.host, function(){
    var stream = new StreamHandler();
    sock.on('error', function(err){
        console.log(err);
    });
    sock.on('close', function(){
        console.log('closed');
        sock.destroy();
    });
    sock.on('data', stream.handleData);

    console.log('sending: Magic Octet + SETTINGS Frame');
    sock.write(Buffer.concat([MagicOctet, initialSettingFrame]));
});
