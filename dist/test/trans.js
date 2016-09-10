"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("../transform");

var Transform = _require.Transform;
var Step = _require.Step;
var Remapping = _require.Remapping;
var TransformError = _require.TransformError;
var liftTarget = _require.liftTarget;
var findWrapping = _require.findWrapping;

var _require2 = require("../model");

var Node = _require2.Node;

var _require3 = require("./cmp");

var cmpNode = _require3.cmpNode;
var cmpStr = _require3.cmpStr;

var _require4 = require("./failure");

var Failure = _require4.Failure;


function tag(tr, name) {
  var calc = /^(.*)([+-]\d+)$/.exec(name),
      extra = 0;
  if (calc) {
    name = calc[1];extra = +calc[2];
  }
  var pos = tr.before.tag[name];
  if (pos == null) return undefined;
  return tr.map(pos) + extra;
}

function mrk(tr, mark) {
  return mark && (typeof mark == "string" ? tr.doc.type.schema.mark(mark) : mark);
}

function range(tr, from, to) {
  var $from = tr.doc.resolve(tag(tr, from || "a")),
      toTag = tag(tr, to || "b");
  return $from.blockRange(toTag == null ? undefined : tr.doc.resolve(toTag));
}

var DelayedTransform = function () {
  function DelayedTransform(steps) {
    _classCallCheck(this, DelayedTransform);

    this.steps = steps;
  }

  _createClass(DelayedTransform, [{
    key: "plus",
    value: function plus(f) {
      return new DelayedTransform(this.steps.concat(f));
    }
  }, {
    key: "addMark",
    value: function addMark(mark, from, to) {
      return this.plus(function (tr) {
        return tr.addMark(tag(tr, from || "a"), tag(tr, to || "b"), mrk(tr, mark));
      });
    }
  }, {
    key: "rmMark",
    value: function rmMark(mark, from, to) {
      return this.plus(function (tr) {
        return tr.removeMark(tag(tr, from || "a"), tag(tr, to || "b"), mrk(tr, mark));
      });
    }
  }, {
    key: "ins",
    value: function ins(nodes, at) {
      return this.plus(function (tr) {
        return tr.insert(tag(tr, at || "a"), typeof nodes == "string" ? tr.doc.type.schema.node(nodes) : nodes);
      });
    }
  }, {
    key: "del",
    value: function del(from, to) {
      return this.plus(function (tr) {
        return tr.delete(tag(tr, from || "a"), tag(tr, to || "b"));
      });
    }
  }, {
    key: "txt",
    value: function txt(text, at) {
      return this.plus(function (tr) {
        return tr.insertText(tag(tr, at || "a"), text);
      });
    }
  }, {
    key: "join",
    value: function join(at) {
      return this.plus(function (tr) {
        return tr.join(tag(tr, at || "a"));
      });
    }
  }, {
    key: "split",
    value: function split(at, depth, type, attrs) {
      return this.plus(function (tr) {
        return tr.split(tag(tr, at || "a"), depth, type && tr.doc.type.schema.nodeType(type), attrs);
      });
    }
  }, {
    key: "lift",
    value: function lift(from, to) {
      return this.plus(function (tr) {
        var r = range(tr, from, to);
        return tr.lift(r, liftTarget(r));
      });
    }
  }, {
    key: "wrap",
    value: function wrap(type, attrs, from, to) {
      return this.plus(function (tr) {
        var r = range(tr, from, to);
        return tr.wrap(r, findWrapping(r, tr.doc.type.schema.nodeType(type), attrs));
      });
    }
  }, {
    key: "blockType",
    value: function blockType(type, attrs, from, to) {
      return this.plus(function (tr) {
        return tr.setBlockType(tag(tr, from || "a"), tag(tr, to || "b"), tr.doc.type.schema.nodeType(type), attrs);
      });
    }
  }, {
    key: "nodeType",
    value: function nodeType(type, attrs, at) {
      return this.plus(function (tr) {
        return tr.setNodeType(tag(tr, at || "a"), tr.doc.type.schema.nodeType(type), attrs);
      });
    }
  }, {
    key: "repl",
    value: function repl(slice, from, to) {
      return this.plus(function (tr) {
        var s = slice instanceof Node ? slice.slice(slice.tag.a, slice.tag.b) : slice;
        tr.replace(tag(tr, from || "a"), tag(tr, to || "b"), s);
      });
    }
  }, {
    key: "get",
    value: function get(doc) {
      var tr = new Transform(doc);
      for (var i = 0; i < this.steps.length; i++) {
        this.steps[i](tr);
      }return tr;
    }
  }]);

  return DelayedTransform;
}();

var tr = new DelayedTransform([]);
exports.tr = tr;

function invert(transform) {
  var out = new Transform(transform.doc);
  for (var i = transform.steps.length - 1; i >= 0; i--) {
    out.step(transform.steps[i].invert(transform.docs[i]));
  }return out;
}

function testMapping(maps, pos, newPos, label) {
  var mapped = pos;
  maps.forEach(function (m) {
    return mapped = m.map(mapped, 1);
  });
  cmpStr(mapped, newPos, label);

  var remap = new Remapping();
  for (var i = maps.length - 1; i >= 0; i--) {
    var id = remap.addToFront(maps[i]);
    remap.addToBack(maps[i].invert(), id);
  }
  cmpStr(remap.map(pos, 1), pos, label + " round trip");
}

function testStepJSON(tr) {
  var newTR = new Transform(tr.before);
  tr.steps.forEach(function (step) {
    return newTR.step(Step.fromJSON(tr.doc.type.schema, step.toJSON()));
  });
  cmpNode(tr.doc, newTR.doc);
}

function testTransform(delayedTr, doc, expect) {
  var tr = void 0;
  try {
    tr = delayedTr.get(doc);
  } catch (e) {
    if (!(e instanceof TransformError)) throw e;
    if (expect != "fail") throw new Failure("Transform failed unexpectedly: " + e);
    return;
  }
  if (expect == "fail") throw new Failure("Transform succeeded unexpectedly");

  cmpNode(tr.doc, expect);
  cmpNode(invert(tr).doc, tr.before, "inverted");

  testStepJSON(tr);

  var maps = tr.maps;
  for (var tag in expect.tag) {
    // FIXME Babel 6.5.1 screws this up when I use let
    testMapping(maps, tr.before.tag[tag], expect.tag[tag], tag);
  }
}
exports.testTransform = testTransform;