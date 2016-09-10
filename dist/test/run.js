"use strict";

var _require = require("./failure");

var Failure = _require.Failure;

require("./all");
require("source-map-support").install();

var _require2 = require("./tests");

var tests = _require2.tests;
var filter = _require2.filter;


var fail = 0,
    ran = 0;

// declare global: process
var filters = process.argv.slice(2);

for (var name in tests) {
  if (!filter(name, filters)) continue;
  ++ran;
  try {
    tests[name]();
  } catch (e) {
    ++fail;
    if (e instanceof Failure) console["log"](name + ": " + e);else console["log"](name + ": " + (e.stack || e));
  }
}

console["log"]((fail ? "\n" : "") + ran + " test ran. " + (fail ? fail + " failures." : "All passed."));
process.exit(fail ? 1 : 0);