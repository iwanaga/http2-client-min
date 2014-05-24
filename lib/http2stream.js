var Http2         = require('./http2constant');
var Http2Response = require('./http2response');

function StreamHandler(sock) {
    var self      = this;
    this.socket   = sock;
    this.request  = new Buffer(0);
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
                        self.socket.write(self.request);
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
StreamHandler.prototype.setRequest = function(request) {
    var headerFrameLen = 0;
    var streamId = 0x1;
    var frameHeader = [
        0x0, headerFrameLen, Http2.FrameType.HEADERS,
        Http2.HeaderFlag.END_HEADERS | Http2.HeaderFlag.END_STREAM,
        0x0, 0x0, 0x0, streamId
    ];

    //var literalWithoutIndex = parseInt('01000000', 2);
    var literalNeverIndexed = parseInt('00010000', 2);
    var headerBlock = [];
    for (var i = 0; i < request.length; i++) {
        //headerBlock.push(literalWithoutIndex);
        headerBlock.push(literalNeverIndexed);
        headerBlock.push(request[i].key.length);
        for (var j = 0; j < request[i].key.length; j++) {
            headerBlock.push(request[i].key.charCodeAt(j));
        }
        headerBlock.push(request[i].val.length);
        for (var j = 0; j < request[i].val.length; j++) {
            headerBlock.push(request[i].val.charCodeAt(j));
        }
    }
    var priority = [0x0, 0x0, 0x0, 0x0];
    var hasPriorityFlag = false;
    var framePayload = [];
    if (hasPriorityFlag) {
        framePayload = priority;
    }
    framePayload = framePayload.concat(headerBlock);
    
    headerFrameLen = framePayload.length;
    frameHeader[1] = headerFrameLen;
    this.request = new Buffer([]
    			      .concat(frameHeader)
    			      .concat(framePayload));
};
module.exports = StreamHandler;