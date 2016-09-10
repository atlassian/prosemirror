"use strict";

var _require = require("../tests");

var defTest = _require.defTest;

var _require2 = require("../../edit");

var ProseMirror = _require2.ProseMirror;

var _require3 = require("../../schema-basic");

var schema = _require3.schema;


var tempPMs = null;

function tempEditors(options) {
  var space = document.querySelector("#workspace");
  if (tempPMs) {
    tempPMs.forEach(function (pm) {
      return space.removeChild(pm.wrapper);
    });
    tempPMs = null;
  }
  return tempPMs = options.map(function (options) {
    if (!options) options = {};
    options.place = space;
    if (!options.doc) options.schema = schema;
    var pm = new ProseMirror(options);
    var a = options.doc && options.doc.tag && options.doc.tag.a;
    if (a != null) {
      if (options.doc.resolve(a).parent.isTextblock) pm.setTextSelection(a, options.doc.tag.b);else pm.setNodeSelection(a);
    }
    return pm;
  });
}
exports.tempEditors = tempEditors;

function tempEditor(options) {
  return tempEditors([options])[0];
}
exports.tempEditor = tempEditor;

function namespace(space, defaults) {
  return function (name, f, options) {
    if (!options) options = {};
    if (defaults) for (var opt in defaults) {
      if (!options.hasOwnProperty(opt)) options[opt] = defaults[opt];
    }defTest(space + "_" + name, function () {
      return f(tempEditor(options));
    });
  };
}
exports.namespace = namespace;

function dispatch(pm, key) {
  pm.input.dispatchKey(key);
}
exports.dispatch = dispatch;