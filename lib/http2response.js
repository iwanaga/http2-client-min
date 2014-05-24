var Http2          = require('./http2constant');
var staticTable    = require('./staticTable');
var HuffmanDecoder = require('./huffman');

function Http2Response(data){
    this.frameHeader = null;
    this.payloadBuff = null;
    this.responseSize = 0;
    this.sendBuff = new Buffer(0);
    this.payloadIndex = 0;
    this.settings = {};
}

Http2Response.prototype.setFrameHeader = function(buffer) {
    this.frameHeader = {
        size     : buffer.readUInt16BE(0),
        type     : Http2.Frame[buffer.readUInt8(2)],
        flag     : buffer.readUInt8(3),
        streamId : buffer.readUInt32BE(4)
    };
};

Http2Response.prototype.setPayload = function(payload, callback) {
    this.payloadBuff = payload;
    this.responseSize = Http2.FrameHeaderSize + this.frameHeader.size;
    console.log(this);
    this[this.frameHeader.type]();

    callback && callback();
};

Http2Response.prototype.getNumberOfSettings = function() {
    return (this.frameHeader.size / (Http2.SettingIdentifierSize + Http2.SettingValueSize));
};

Http2Response.prototype.setStreamConf = function(setting) {
    this.settings[setting[0]] = setting[1];
};

/**
 * @ret [String: key, Number: value]
 */
Http2Response.prototype.getSetting = function(setting) {
    return [
        Http2.SettingIdentifier[setting[0]],
        setting.slice(
            Http2.SettingIdentifierSize,
            setting.length
        ).readUInt32BE(0)
    ];
};
/**
 * Frame Handlers
 */
var ACK = new Buffer([0, 0, Http2.FrameType.SETTINGS, 1,
                      0, 0, 0, 0]);
Http2Response.prototype.SETTINGS = function() {
    if ( this.isACK() ) {
        console.log('[debug] receipt SETTING ACK');
        this.sendBuff = ACK;
        this.sendACK = true;
    }
    for (var i = 0, n = this.getNumberOfSettings(); i < n; i++) {
        this.setStreamConf(this.getSetting(this.payloadBuff.slice(i * Http2.SettingParameterSize, (i + 1) * Http2.SettingParameterSize)));
    }
    console.log(this.settings);
};
Http2Response.prototype.isACK = function() {
    return (this.frameHeader.flag === 0x1);
};
Http2Response.prototype.HEADERS = function() {
    console.log('HEADERS');
    console.log(this.headersFlag());
    while (this.payloadIndex < this.payloadBuff.length) {
        if (this.bothIndexed()) {
            console.log('[debug] Header name, value: indexed');
            console.log(this.indexToLiteral());
            this.payloadIndex++;
        } else if (this.bothLiteral()) {
            console.log('[debug] === Header name, value: literal ===');
            this.decodeLiteral();
            this.payloadIndex++;
        } else {
            console.log('[debug] Header name: indexed, value: literal');
            var name = this.getIndexedName();
            this.payloadIndex++;

            //console.log('next octet: ', this.payloadBuff[this.payloadIndex].toString(2));
            if (this.isHuffmanEncoding()) {
                console.log('[debug] value encoding: Huffman');
                var prefix = this.getHuffmanPrefix();
		this.payloadIndex++;
		var decoder = new HuffmanDecoder(this.payloadBuff, this.payloadIndex);
                decoder.valueSize = prefix;
		decoder.traverse(decoder.getNextBit());
                console.log(name, decoder.decoded.join(''));
                this.payloadIndex += prefix;
                //console.log('next octet: ', this.payloadBuff[this.payloadIndex].toString(2));
                //console.log('value length: ', this.payloadBuff[this.payloadIndex]);
            } else {
                console.log('[debug] value encoding: ascii');
                var asciiLen = this.payloadBuff[this.payloadIndex];
                //console.log('[debug] value length: ', asciiLen);
                this.payloadIndex++;
                console.log(name, this.payloadBuff.slice(this.payloadIndex, this.payloadIndex + asciiLen).toString('ascii'));
		this.payloadIndex += asciiLen;
            }
        }
    }
};
Http2Response.prototype.headersFlag = function() {
    var flags = [];
    if (this.frameHeader.flag & 0x1) {
        flags.push('END_STREAM');
    }
    if (this.frameHeader.flag & 0x2) {
        flags.push('RESERVED');
    }
    if (this.frameHeader.flag & 0x4) {
        flags.push('END_HEADERS');
    }
    if (this.frameHeader.flag & 0x8) {
        flags.push('PRIORITY');
    }
    return flags;
};
//Http2Response.prototype.isIndexed = function(i) {
//    return ((this.payloadBuff[this.payloadIndex] & parseInt('1' + Array(7+1).join('0'), 2)) > 0);
//};
Http2Response.prototype.bothIndexed = function() {
    return ((this.payloadBuff[this.payloadIndex] & parseInt('1' + Array(7+1).join('0'), 2)) > 0);
};
Http2Response.prototype.bothLiteral = function() {
    // ignore second bit, the flag to remeber in header table
    return ((this.payloadBuff[this.payloadIndex] & parseInt('10' + Array(6+1).join('1'), 2)) === 0);
};
Http2Response.prototype.getIndexedName = function() {
    console.log('[debug] name index', this.payloadBuff[this.payloadIndex] & parseInt(Array(6+1).join('1'),2));
    return (staticTable[this.payloadBuff[this.payloadIndex] & parseInt(Array(6+1).join('1'),2)].key);
};
Http2Response.prototype.isHuffmanEncoding = Http2Response.prototype.bothIndexed;
Http2Response.prototype.getHuffmanPrefix = function() {
    return (this.payloadBuff[this.payloadIndex] & parseInt(Array(7+1).join('1'), 2));
};
Http2Response.prototype.indexToLiteral = function(i) {
    return (staticTable[this.payloadBuff[this.payloadIndex] & parseInt(Array(7+1).join('1'),2)]);
};
Http2Response.prototype.decodeLiteral = function(i) {
    // Todo
    // get name size
    // get name in ascii
    // get value size
    // get value in ascii

    //var size = this.payloadBuff[this.payloadIndex];
    //console.log(size);
    //for (var i = 0; i < size; i++) {
    //    staticTable[this.payloadBuff[this.payloadIndex] & parseInt(Array(7+1).join('1'),2)];
    //}
    return;
};
Http2Response.prototype.DATA = function() {
    console.log('DATA');
    console.log(this.headersFlag());
    //console.log(this.payloadBuff.toString('ascii'));
};
Http2Response.prototype.RST_STREAM = function() {
    console.log('RST_STREAM');
};
Http2Response.prototype.GOAWAY = function() {
    console.log('GOAWAY');
};
Http2Response.prototype.frameHander = {
    PRIORITY: function(){},
    PUSH_PROMISE: function(){},
    PING: function(){},
    WINDOW_UPDATE: function(){},
    CONTINUATION: function(){}
};

/* utility functions */
Http2Response.prototype.readUInt24BE = function(buffer) {
    return (buffer[0] << 16 | buffer[1] << 8 | buffer [2]);
};

module.exports = Http2Response;