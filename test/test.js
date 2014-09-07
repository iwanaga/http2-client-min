var assert = require('assert');
var HuffmanDecoder = require('../lib/huffman');

function testTree() {
    var tree = (new HuffmanDecoder()).currentNode;
    console.log(tree[0][0][0][0][0]);
    console.log(tree[1][0][0][0][0][0]);
    console.log(tree[1][1][1][1][1][1][1][0][0][0]);
    console.log(tree[1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][0][0][0][0]);
    console.log(tree[1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1]);
}

function toByteBuffer(byteString) {
    if (arguments.length === 0 || byteString.length === 0) {
        throw Error('Invalid Argument');
    }
    var i;

    console.log('input: ', byteString);
    if (byteString.length % 8 !== 0) {
        // Each buffer element store 8 bit integer.
        // Allocate input bits to largest bit by adding 0 to suffix of buffer.
        var suffixPaddingLength = 8 - (byteString.length % 8);
        var padding = '';
        for (i = 0; i < suffixPaddingLength; i++) {
            padding += '0';
        }
        byteString += padding;
    }

    // concat each 8 bit fraction.
    var buffLength = byteString.length / 8;
    console.log('len: ', buffLength);
    var returnBuff = new Buffer(buffLength);
    for (i = 0; i < buffLength; i++) {
        console.log(byteString.slice(8 * i, 8 * (i + 1)));
        returnBuff[i] = parseInt(byteString.slice(8 * i, 8 * (i + 1)), 2);
    }

    return returnBuff;
}

function equal(byteString, expectedString) {
    var huffman = new HuffmanDecoder(toByteBuffer(byteString), 0);
    huffman.traverse(huffman.getNextBit());
    assert.strictEqual(huffman.decoded.join(''), expectedString);
}

function testDecode() {
    // 5 bit
    equal('00000', '0');
    equal('01001', 't');

    // 6 bit
    equal('010101', '%');
    equal('100000', '=');

    // 7 bit
    equal('1111010', 'y');

    // 8 bit
    equal('11111100', 'X');

    // 10 bit
    equal('1111111000', '!');

    console.log('PASSED ALL TESTS');
}

testTree();
//testDecode();
