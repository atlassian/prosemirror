"use strict";

var _require = require("./def");

var namespace = _require.namespace;
var dispatch = _require.dispatch;

var _require2 = require("../build");

var doc = _require2.doc;
var p = _require2.p;

var _require3 = require("../cmp");

var cmp = _require3.cmp;
var is = _require3.is;

var _require4 = require("../tests");

var defTest = _require4.defTest;

var _require5 = require("../../edit");

var Keymap = _require5.Keymap;


function trace(prop) {
  return function (pm) {
    return pm.cached[prop] = (pm.cached[prop] || 0) + 1;
  };
}

var extraMap = new Keymap({
  "'B'": trace("b"),
  "Ctrl-X C": trace("c"),
  "Ctrl-A": trace("a")
});

var test = namespace("keys", {
  doc: doc(p("foo"))
});

test("basic", function (pm) {
  pm.addKeymap(extraMap);
  dispatch(pm, "'B'");
  dispatch(pm, "'B'");
  cmp(pm.cached.b, 2);
});

test("multi", function (pm) {
  pm.addKeymap(extraMap);
  dispatch(pm, "Ctrl-X");
  dispatch(pm, "C");
  dispatch(pm, "Ctrl-X");
  dispatch(pm, "C");
  cmp(pm.cached.c, 2);
});

test("addKeymap", function (pm) {
  pm.addKeymap(extraMap);
  var map = new Keymap({ "Ctrl-A": trace("a2") });
  pm.addKeymap(map, 60);
  dispatch(pm, "Ctrl-A");
  cmp(pm.cached.a, undefined);
  cmp(pm.cached.a2, 1);
  pm.removeKeymap(map);
  dispatch(pm, "Ctrl-A");
  cmp(pm.cached.a, 1);
  cmp(pm.cached.a2, 1);
});

test("addKeymap_bottom", function (pm) {
  pm.addKeymap(extraMap);
  var mapTop = new Keymap({ "Ctrl-A": trace("a2") });
  var mapBot = new Keymap({ "Ctrl-A": trace("a3"), "Ctrl-D": trace("d") });
  pm.addKeymap(mapTop, 60);
  pm.addKeymap(mapBot, 40);
  dispatch(pm, "Ctrl-A");
  cmp(pm.cached.a2, 1);
  cmp(pm.cached.a3, undefined);
  dispatch(pm, "Ctrl-D");
  cmp(pm.cached.d, 1);
  pm.removeKeymap(mapBot);
  dispatch(pm, "Ctrl-D");
  cmp(pm.cached.d, 1);
});

defTest("keys_add_inconsistent", function () {
  var map = new Keymap({ "Ctrl-A": "foo", "Ctrl-B Ctrl-C": "quux" });
  try {
    map.addBinding("Ctrl-A", "bar");
    is(false);
  } catch (e) {
    if (!/Inconsistent/.test(e.toString())) throw e;
  }
  try {
    map.addBinding("Ctrl-A Ctrl-X", "baz");
    is(false);
  } catch (e) {
    if (!/Inconsistent/.test(e.toString())) throw e;
  }
  try {
    map.addBinding("Ctrl-B", "bak");
    is(false);
  } catch (e) {
    if (!/Inconsistent/.test(e.toString())) throw e;
  }
});

defTest("keys_add_consistent", function () {
  var map = new Keymap({ "Ctrl-A Ctrl-B": "foo", "Ctrl-A Ctrl-C": "bar" });
  map.removeBinding("Ctrl-A Ctrl-B");
  map.removeBinding("Ctrl-A Ctrl-C");
  map.addBinding("Ctrl-A", "quux");
});