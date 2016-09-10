"use strict";

;
var _require = require("./transform");

exports.Transform = _require.Transform;
exports.TransformError = _require.TransformError;

var _require2 = require("./step");

exports.Step = _require2.Step;
exports.StepResult = _require2.StepResult;

var _require3 = require("./structure");

exports.joinPoint = _require3.joinPoint;
exports.joinable = _require3.joinable;
exports.canSplit = _require3.canSplit;
exports.insertPoint = _require3.insertPoint;
exports.liftTarget = _require3.liftTarget;
exports.findWrapping = _require3.findWrapping;

var _require4 = require("./map");

exports.PosMap = _require4.PosMap;
exports.MapResult = _require4.MapResult;
exports.Remapping = _require4.Remapping;
exports.mapThrough = _require4.mapThrough;
exports.mapThroughResult = _require4.mapThroughResult;

var _require5 = require("./mark_step");

exports.AddMarkStep = _require5.AddMarkStep;
exports.RemoveMarkStep = _require5.RemoveMarkStep;

var _require6 = require("./replace_step");

exports.ReplaceStep = _require6.ReplaceStep;
exports.ReplaceAroundStep = _require6.ReplaceAroundStep;

require("./mark");
require("./replace");

// !! This module defines a way to transform documents. Transforming
// happens in `Step`s, which are atomic, well-defined modifications to
// a document. [Applying](`Step.apply`) a step produces a new
// document.
//
// Each step provides a [position map](#PosMap) that maps positions in
// the old document to position in the new document. Steps can be
// [inverted](#Step.invert) to create a step that undoes their effect,
// and chained together in a convenience object called a `Transform`.
//
// This module does not depend on the browser API being available
// (i.e. you can load it into any JavaScript environment).
//
// You can read more about transformations in [this
// guide](guide/transform.md).