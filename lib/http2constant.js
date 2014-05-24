exports.MagicOctet = new Buffer('PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n', 'ascii');
exports.FrameType = {
    DATA         : 0x0,
    HEADERS      : 0x1,
    PRIORITY     : 0x2,
    RST_STREAM   : 0x3,
    SETTINGS     : 0x4,
    PUSH_PROMISE : 0x5,
    PING         : 0x6,
    GOAWAY       : 0x7,
    WINDOW_UPDATE: 0x8,
    CONTINUATION : 0x9,
    ALTSVC       : 0xA,
    BLOCKED      : 0xB
};
exports.Frame = [
    'DATA', 'HEADERS', 'PRIORITY', 'RST_STREAM', 'SETTINGS',
    'PUSH_PROMISE', 'PING', 'GOAWAY', 'WINDOW_UPDATE', 'CONTINUATION'
];
exports.FrameHeaderSize = 8;
exports.SettingIdentifierSize = 8/8;
exports.SettingValueSize = 32/8;
exports.SettingParameterSize = this.SettingIdentifierSize + this.SettingValueSize;
exports.SettingIdentifier = {
    '1' : 'SETTINGS_HEADER_TABLE_SIZE',
    '2' : 'SETTINGS_ENABLE_PUSH',
    '3' : 'SETTINGS_MAX_CONCURRENT_STREAMS',
    '4' : 'SETTINGS_INITIAL_WINDOW_SIZE',
    '5' : 'SETTINGS_COMPRESS_DATA',
    '10': 'SETTINGS_FLOW_CONTROL_OPTIONS'
};
exports.HeaderFlag = {
    END_STREAM : 0x1,
    RESERVED   : 0x2,
    END_HEADERS: 0x4,
    PRIORITY   : 0x8
};