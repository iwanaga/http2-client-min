var HuffmanTree = require('./huffmanTree09');
function HuffmanDecoder(payload, offset) {
    this.payload = payload;
    this.index = offset || 0;
    this.valueSize = 0;
    this.currentOctet = 0;
    this.currentDigit = -1;
    this.currentNode = null;
    this.decoded = [];
    this.reset = function() {
        this.currentNode = HuffmanTree.getTree();
    };
    this.reset();
}
HuffmanDecoder.prototype.getNextBit = function() {
    if (this.currentDigit >= 7) {
        this.currentDigit = -1;
        this.currentOctet++;
        this.index++;
    }
    this.currentDigit++;
    return ( (this.payload[this.index] & Math.pow(2, 7 - this.currentDigit)) ? 1 : 0);
};
HuffmanDecoder.prototype.traverse = function(bit) {
    this.currentNode = this.currentNode[bit];
    if (this.currentNode.length === 1) {
        this.decoded.push(this.currentNode);
        this.reset();
    } else if (this.currentNode.length === 3) {
        console.log('EOS');
        return;
    }
    if (this.currentOctet >= this.valueSize - 1 && this.currentDigit >= 7) {
        return;
    }
    this.traverse(this.getNextBit());
};

module.exports = HuffmanDecoder;
