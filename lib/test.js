var HuffmanDecoder = require('./huffman');

function testTree() {
    var tree = (new HuffmanDecoder()).currentNode;
    console.log(tree[0][0][0][1]);
    console.log(tree[0][1][0][1][0]);
    console.log(tree[1][0][0][0][0]);
    console.log(tree[1][0][1][0][0][0]);
    console.log(tree[1][1][0][1][1][0][0]);
    console.log(tree[1][1][1][0][0][1][1]);
    console.log(tree[1][1][1][0][1][1][1][0]);
    console.log(tree[1][1][1][1][0][1][1][1][1]);
    console.log(tree[1][1][1][1][1][0][0][1][0]);
    console.log(tree[1][1][1][1][1][1][1][0][0][0]);
    console.log(tree[1][1][1][1][1][1][1][1][1][1][1][0][1]);
    console.log(tree[1][1][1][1][1][1][1][1][1][1][1][1][0][1]);
    console.log(tree[1][1][1][1][1][1][1][1][1][1][1][1][1][1][0][1]);
    console.log(tree[1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][0]);
    console.log(tree[1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][1][0][1][1][1][0][1]);
}

function testDecode() {
    var payload, huffman;

    // y, 8 bit
    payload = new Buffer(1);
    payload[0] = parseInt('11110101', 2);
    huffman = new HuffmanDecoder(payload, 0);
    huffman.traverse(huffman.getNextBit());

    // a, 5 bit
    payload = new Buffer(1);
    payload[0] = parseInt('01111000', 2);
    huffman = new HuffmanDecoder(payload, 0);
    huffman.traverse(huffman.getNextBit());

    // {, 16 bit
    payload = new Buffer(2);
    payload[0] = parseInt('11111111', 2);
    payload[1] = parseInt('11111100', 2);
    huffman = new HuffmanDecoder(payload, 0);
    huffman.traverse(huffman.getNextBit());

    // `, 17 bit
    payload = new Buffer(3)
    payload[0] = parseInt('11111111', 2);
    payload[1] = parseInt('11111111', 2);
    payload[2] = 0;
    huffman = new HuffmanDecoder(payload, 0);
    huffman.traverse(huffman.getNextBit());
}

testTree();
testDecode();
