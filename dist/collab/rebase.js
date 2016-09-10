"use strict";

var _require = require("../transform");

var Remapping = _require.Remapping;
var Transform = _require.Transform;


function rebaseSteps(doc, forward, steps, maps) {
  var remap = new Remapping([], forward.slice());
  var transform = new Transform(doc);
  var positions = [];

  for (var i = 0; i < steps.length; i++) {
    var step = steps[i].map(remap);
    var result = step && transform.maybeStep(step);
    var id = remap.addToFront(maps[i].invert());
    if (result && result.doc) {
      remap.addToBack(step.posMap(), id);
      positions.push(transform.steps.length - 1);
    } else {
      positions.push(-1);
    }
  }
  return { doc: transform.doc, transform: transform, mapping: remap, positions: positions };
}
exports.rebaseSteps = rebaseSteps;