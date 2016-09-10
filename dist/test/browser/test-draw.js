"use strict";

var _require = require("./def");

var namespace = _require.namespace;

var _require2 = require("../build");

var doc = _require2.doc;
var pre = _require2.pre;
var h1 = _require2.h1;
var p = _require2.p;

var _require3 = require("../cmp");

var cmp = _require3.cmp;
var cmpStr = _require3.cmpStr;


var test = namespace("draw");

test("update", function (pm) {
  pm.tr.typeText("bar").apply();
  pm.flush();
  cmpStr(pm.content.textContent, "barfoo");
}, { doc: doc(p("foo")) });

test("minimal_at_end", function (pm) {
  var oldP = pm.content.querySelector("p");
  pm.tr.typeText("!").apply();
  pm.flush();
  cmp(pm.content.querySelector("p"), oldP);
}, { doc: doc(h1("foo<a>"), p("bar")) });

test("minimal_at_start", function (pm) {
  var oldP = pm.content.querySelector("p");
  pm.tr.insertText(2, "!").apply();
  pm.flush();
  cmp(pm.content.querySelector("p"), oldP);
}, { doc: doc(p("foo"), h1("bar")) });

test("minimal_around", function (pm) {
  var oldP = pm.content.querySelector("p");
  var oldPre = pm.content.querySelector("pre");
  pm.tr.insertText(2, "!").apply();
  pm.flush();
  cmp(pm.content.querySelector("p"), oldP);
  cmp(pm.content.querySelector("pre"), oldPre);
}, { doc: doc(p("foo"), h1("bar"), pre("baz")) });

test("minimal_on_split", function (pm) {
  var oldP = pm.content.querySelector("p");
  var oldPre = pm.content.querySelector("pre");
  pm.tr.split(8).apply();
  pm.flush();
  cmp(pm.content.querySelector("p"), oldP);
  cmp(pm.content.querySelector("pre"), oldPre);
}, { doc: doc(p("foo"), h1("bar"), pre("baz")) });

test("minimal_on_join", function (pm) {
  var oldP = pm.content.querySelector("p");
  var oldPre = pm.content.querySelector("pre");
  pm.tr.join(10).apply();
  pm.flush();
  cmp(pm.content.querySelector("p"), oldP);
  cmp(pm.content.querySelector("pre"), oldPre);
}, { doc: doc(p("foo"), h1("bar"), h1("x"), pre("baz")) });