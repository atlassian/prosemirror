"use strict";

var _require = require("../schema-basic");

var schema = _require.schema;

var _require2 = require("../model");

var Node = _require2.Node;

// This file defines a set of helpers for building up documents to be
// used in the test suite. You can say, for example, `doc(p("foo"))`
// to create a document with a paragraph with the text 'foo' in it.
//
// These also support angle-brace notation for marking 'tags'
// (positions) inside of such nodes. If you include `<x>` inside of a
// string, as part of a bigger text node or on its own, the resulting
// node and its parent nodes will have a `tag` property added to them
// that maps this tag name (`x`) to its position inside of that node.

var noTag = Node.prototype.tag = Object.create(null);

function flatten(children, f) {
  var result = [],
      pos = 0,
      tag = noTag;

  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.tag && child.tag != Node.prototype.tag) {
      if (tag == noTag) tag = Object.create(null);
      for (var _id in child.tag) {
        tag[_id] = child.tag[_id] + (child.flat || child.isText ? 0 : 1) + pos;
      }
    }

    if (typeof child == "string") {
      var re = /<(\w+)>/g,
          m = void 0,
          at = 0,
          out = "";
      while (m = re.exec(child)) {
        out += child.slice(at, m.index);
        pos += m.index - at;
        at = m.index + m[0].length;
        if (tag == noTag) tag = Object.create(null);
        tag[m[1]] = pos;
      }
      out += child.slice(at);
      pos += child.length - at;
      if (out) result.push(f(schema.text(out)));
    } else if (child.flat) {
      for (var j = 0; j < child.flat.length; j++) {
        var node = f(child.flat[j]);
        pos += node.nodeSize;
        result.push(node);
      }
    } else {
      var _node = f(child);
      pos += _node.nodeSize;
      result.push(_node);
    }
  }
  return { nodes: result, tag: tag };
}

function id(x) {
  return x;
}

// : (string, ?Object) → (...content: [union<string, Node>]) → Node
// Create a builder function for nodes with content.
function block(type, attrs) {
  return function () {
    var _flatten = flatten(arguments, id);

    var nodes = _flatten.nodes;
    var tag = _flatten.tag;

    var node = schema.nodes[type].create(attrs, nodes);
    if (tag != noTag) node.tag = tag;
    return node;
  };
}

// Create a builder function for marks.
function mark(type, attrs) {
  var mark = schema.mark(type, attrs);
  return function () {
    var _flatten2 = flatten(arguments, function (n) {
      return mark.type.isInSet(n.marks) ? n : n.mark(mark.addToSet(n.marks));
    });

    var nodes = _flatten2.nodes;
    var tag = _flatten2.tag;

    return { flat: nodes, tag: tag };
  };
}

var dataImage = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
exports.dataImage = dataImage;

var doc = block("doc");
exports.doc = doc;
var p = block("paragraph");
exports.p = p;
var blockquote = block("blockquote");
exports.blockquote = blockquote;
var pre = block("code_block");
exports.pre = pre;
var h1 = block("heading", { level: 1 });
exports.h1 = h1;
var h2 = block("heading", { level: 2 });
exports.h2 = h2;
var li = block("list_item");
exports.li = li;
var ul = block("bullet_list");
exports.ul = ul;
var ol = block("ordered_list");
exports.ol = ol;

var br = schema.node("hard_break");
exports.br = br;
var img = schema.node("image", { src: dataImage, alt: "x" });
exports.img = img;
var img2 = schema.node("image", { src: dataImage, alt: "y" });
exports.img2 = img2;
var hr = schema.node("horizontal_rule");
exports.hr = hr;

var em = mark("em");
exports.em = em;
var strong = mark("strong");
exports.strong = strong;
var code = mark("code");
exports.code = code;
var a = mark("link", { href: "http://foo" });
exports.a = a;
var a2 = mark("link", { href: "http://bar" });
exports.a2 = a2;