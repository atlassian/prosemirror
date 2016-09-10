"use strict";

var _require = require("../model");

var Fragment = _require.Fragment;

var _require2 = require("../schema-basic");

var schema = _require2.schema;

var _require3 = require("./build");

var doc = _require3.doc;
var blockquote = _require3.blockquote;
var p = _require3.p;
var li = _require3.li;
var ul = _require3.ul;
var em = _require3.em;
var strong = _require3.strong;
var code = _require3.code;
var br = _require3.br;
var img = _require3.img;

var _require4 = require("./failure");

var Failure = _require4.Failure;

var _require5 = require("./tests");

var defTest = _require5.defTest;

var _require6 = require("./cmp");

var cmpNode = _require6.cmpNode;
var cmpStr = _require6.cmpStr;


function str(name, node, str) {
  defTest("node_string_" + name, function () {
    return cmpStr(node, str);
  });
}

str("nesting", doc(ul(li(p("hey"), p()), li(p("foo")))), 'doc(bullet_list(list_item(paragraph("hey"), paragraph), list_item(paragraph("foo"))))');

str("inline_element", doc(p("foo", img, br, "bar")), 'doc(paragraph("foo", image, hard_break, "bar"))');

str("marks", doc(p("foo", em("bar", strong("quux")), code("baz"))), 'doc(paragraph("foo", em("bar"), em(strong("quux")), code("baz")))');

function cut(name, doc, cut) {
  defTest("node_cut_" + name, function () {
    return cmpNode(doc.cut(doc.tag.a || 0, doc.tag.b), cut);
  });
}

cut("block", doc(p("foo"), "<a>", p("bar"), "<b>", p("baz")), doc(p("bar")));

cut("text", doc(p("0"), p("foo<a>bar<b>baz"), p("2")), doc(p("bar")));

cut("deep", doc(blockquote(ul(li(p("a"), p("b<a>c")), li(p("d")), "<b>", li(p("e"))), p("3"))), doc(blockquote(ul(li(p("c")), li(p("d"))))));

cut("left", doc(blockquote(p("foo<b>bar"))), doc(blockquote(p("foo"))));

cut("right", doc(blockquote(p("foo<a>bar"))), doc(blockquote(p("bar"))));

cut("inline", doc(p("foo", em("ba<a>r", img, strong("baz"), br), "qu<b>ux", code("xyz"))), doc(p(em("r", img, strong("baz"), br), "qu")));

function between(name, doc) {
  for (var _len = arguments.length, nodes = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    nodes[_key - 2] = arguments[_key];
  }

  defTest("node_between_" + name, function () {
    var i = 0;
    doc.nodesBetween(doc.tag.a, doc.tag.b, function (node, pos) {
      if (i == nodes.length) throw new Failure("More nodes iterated than listed (" + node.type.name + ")");
      var compare = node.isText ? node.text : node.type.name;
      if (compare != nodes[i++]) throw new Failure("Expected " + JSON.stringify(nodes[i - 1]) + ", got " + JSON.stringify(compare));
      if (!node.isText && doc.nodeAt(pos) != node) throw new Failure("Pos " + pos + " does not point at node " + node + " " + doc.nodeAt(pos));
    });
  });
}

between("text", doc(p("foo<a>bar<b>baz")), "paragraph", "foobarbaz");

between("deep", doc(blockquote(ul(li(p("f<a>oo")), p("b"), "<b>"), p("c"))), "blockquote", "bullet_list", "list_item", "paragraph", "foo", "paragraph", "b");

between("inline", doc(p(em("x"), "f<a>oo", em("bar", img, strong("baz"), br), "quux", code("xy<b>z"))), "paragraph", "foo", "bar", "image", "baz", "hard_break", "quux", "xyz");

function textContent(name, node, expect) {
  defTest("node_textContent_" + name, function () {
    cmpStr(node.textContent, expect);
  });
}

textContent("doc", doc(p("foo")), "foo");

textContent("text", schema.text("foo"), "foo");

function from(name, arg, expect) {
  defTest("node_fragment_from_" + name, function () {
    cmpNode(expect.copy(Fragment.from(arg)), expect);
  });
}

from("single", schema.node("paragraph"), doc(p()));

from("array", [schema.node("hard_break"), schema.text("foo")], p(br, "foo"));

from("fragment", doc(p("foo")).content, doc(p("foo")));

from("null", null, p());

from("append", [schema.text("a"), schema.text("b")], p("ab"));