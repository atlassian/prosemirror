"use strict";

// !! This module implements the ProseMirror editor. It contains
// functionality related to editing, selection, and integration with
// the browser. `ProseMirror` is the class you'll want to instantiate
// and interact with when using the editor.

exports.ProseMirror = require("./main").ProseMirror;
var _require = require("./selection");

exports.Selection = _require.Selection;
exports.TextSelection = _require.TextSelection;
exports.NodeSelection = _require.NodeSelection;

var _require2 = require("./range");

exports.MarkedRange = _require2.MarkedRange;

exports.baseKeymap = require("./keymap").baseKeymap;
var _require3 = require("./plugin");

exports.Plugin = _require3.Plugin;

exports.commands = require("./commands").commands;

exports.Keymap = require("browserkeymap");