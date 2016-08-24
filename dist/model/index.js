"use strict";

// !!
// This module defines ProseMirror's document model, the data
// structure used to define and inspect content documents. It
// includes:
//
// * The [node](#Node) type that represents document elements
//
// * The [schema](#Schema) types used to tag and constrain the
//   document structure
//
// This module does not depend on the browser API being available
// (i.e. you can load it into any JavaScript environment).

exports.Node = require("./node").Node;
var _require = require("./resolvedpos");

exports.ResolvedPos = _require.ResolvedPos;
exports.NodeRange = _require.NodeRange;

exports.Fragment = require("./fragment").Fragment;
var _require2 = require("./replace");

exports.Slice = _require2.Slice;
exports.ReplaceError = _require2.ReplaceError;

exports.Mark = require("./mark").Mark;
var _require3 = require("./schema");

exports.SchemaSpec = _require3.SchemaSpec;
exports.Schema = _require3.Schema;
exports.NodeType = _require3.NodeType;
exports.Block = _require3.Block;
exports.Inline = _require3.Inline;
exports.Text = _require3.Text;
exports.MarkType = _require3.MarkType;
exports.Attribute = _require3.Attribute;
exports.NodeKind = _require3.NodeKind;

var _require4 = require("./content");

exports.ContentMatch = _require4.ContentMatch;


exports.parseDOMInContext = require("./from_dom").parseDOMInContext;