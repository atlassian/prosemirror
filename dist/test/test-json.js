"use strict";

var _require = require("./build");

var doc = _require.doc;
var blockquote = _require.blockquote;
var p = _require.p;
var hr = _require.hr;
var li = _require.li;
var ul = _require.ul;
var em = _require.em;
var strong = _require.strong;
var a = _require.a;
var img = _require.img;

var _require2 = require("./cmp");

var cmpNode = _require2.cmpNode;

var _require3 = require("./tests");

var defTest = _require3.defTest;

var _require4 = require("../schema-basic");

var schema = _require4.schema;


function node(name, doc) {
     defTest("json_node_" + name, function () {
          return cmpNode(schema.nodeFromJSON(doc.toJSON()), doc);
     });
}

node("simple", doc(p("foo")));

node("marks", doc(p("foo", em("bar", strong("baz")), " ", a("x"))));

node("inline_leaf", doc(p("foo", em(img, "bar"))));

node("block_leaf", doc(p("a"), hr, p("b"), p()));

node("nesting", doc(blockquote(ul(li(p("a"), p("b")), li(p(img))), p("c")), p("d")));