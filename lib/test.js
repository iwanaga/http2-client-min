var HuffnamDecoder = require('./huffman');

function test() {
    var tree = (new HuffnamDecoder()).currentNode;
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
test();