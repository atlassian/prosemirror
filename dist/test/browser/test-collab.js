"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("../../collab");

var collabEditing = _require.collabEditing;

var _require2 = require("../build");

var doc = _require2.doc;
var p = _require2.p;

var _require3 = require("../tests");

var defTest = _require3.defTest;

var _require4 = require("../cmp");

var cmpNode = _require4.cmpNode;
var cmp = _require4.cmp;

var _require5 = require("./def");

var tempEditors = _require5.tempEditors;

var DummyServer = function () {
  function DummyServer() {
    _classCallCheck(this, DummyServer);

    this.version = 0;
    this.pms = [];
  }

  _createClass(DummyServer, [{
    key: "attach",
    value: function attach(pm) {
      var _this = this;

      var mod = collabEditing.get(pm);
      mod.mustSend.add(function () {
        return _this.mustSend(pm, mod.clientID);
      });
      this.pms.push(pm);
    }
  }, {
    key: "mustSend",
    value: function mustSend(pm, clientID) {
      var mod = collabEditing.get(pm);
      if (mod.frozen) return;
      var toSend = mod.sendableSteps();
      this.send(pm, toSend.version, toSend.steps, clientID);
    }
  }, {
    key: "send",
    value: function send(_pm, _version, steps, clientID) {
      this.version += steps.length;
      for (var i = 0; i < this.pms.length; i++) {
        collabEditing.get(this.pms[i]).receive(steps, steps.map(function () {
          return clientID;
        }));
      }
    }
  }]);

  return DummyServer;
}();

// Kludge to prevent an editor from sending its changes for a moment


function delay(pm, f) {
  var mod = collabEditing.get(pm);
  mod.frozen = true;
  f();
  mod.frozen = false;
  if (mod.hasSendableSteps()) mod.mustSend.dispatch();
}

function test(name, f, options, n) {
  defTest("collab_" + name, function () {
    var server = new DummyServer();
    var optArray = [];
    for (var i = 0; i < (n || 2); i++) {
      var copy = {};
      for (var prop in options) {
        copy[prop] = options[prop];
      }copy.plugins = (copy.plugins || []).concat(collabEditing.config({ version: server.version }));
      optArray.push(copy);
    }
    var pms = tempEditors(optArray);
    pms.forEach(function (pm) {
      return server.attach(pm);
    });
    f.apply(null, pms);
  });
}

function type(pm, text, pos) {
  pm.tr.insertText(pos || pm.selection.head, text).apply();
}

function cut(pm) {
  pm.history.lastAddedAt = 0;
}

function conv() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var d = args.pop();
  if (typeof d == "string") d = doc(p(d));
  args.forEach(function (pm) {
    return cmpNode(pm.doc, d);
  });
}

test("converge_easy", function (pm1, pm2) {
  type(pm1, "hi");
  type(pm2, "ok", 3);
  type(pm1, "!", 5);
  type(pm2, "...", 1);
  conv(pm1, pm2, "...hiok!");
});

test("converge_rebased", function (pm1, pm2) {
  type(pm1, "hi");
  delay(pm1, function () {
    type(pm1, "A");
    type(pm2, "X");
    type(pm1, "B");
    type(pm2, "Y");
  });
  conv(pm1, pm2, "hiXYAB");
});

test("converge_three", function (pm1, pm2, pm3) {
  type(pm1, "A");
  type(pm2, "U");
  type(pm3, "X");
  type(pm1, "B");
  type(pm2, "V");
  type(pm3, "C");
  conv(pm1, pm2, pm3, "AUXBVC");
}, null, 3);

test("converge_three_rebased", function (pm1, pm2, pm3) {
  type(pm1, "A");
  delay(pm2, function () {
    type(pm2, "U");
    type(pm3, "X");
    type(pm1, "B");
    type(pm2, "V");
    type(pm3, "C");
  });
  conv(pm1, pm2, pm3, "AXBCUV");
}, null, 3);

test("undo_basic", function (pm1, pm2) {
  type(pm1, "A");
  type(pm2, "B");
  type(pm1, "C");
  pm2.history.undo();
  conv(pm1, pm2, "AC");
  type(pm2, "D");
  type(pm1, "E");
  conv(pm1, pm2, "ACDE");
});

test("redo_basic", function (pm1, pm2) {
  type(pm1, "A");
  type(pm2, "B");
  type(pm1, "C");
  pm2.history.undo();
  pm2.history.redo();
  type(pm2, "D");
  type(pm1, "E");
  conv(pm1, pm2, "ABCDE");
});

test("undo_deep", function (pm1, pm2) {
  pm1.setTextSelection(6);
  pm2.setTextSelection(11);
  type(pm1, "!");
  type(pm2, "!");
  cut(pm1);
  delay(pm1, function () {
    type(pm1, " ...");
    type(pm2, " ,,,");
  });
  cut(pm1);
  type(pm1, "*");
  type(pm2, "*");
  pm1.history.undo();
  conv(pm1, pm2, doc(p("hello! ..."), p("bye! ,,,*")));
  pm1.history.undo();
  pm1.history.undo();
  conv(pm1, pm2, doc(p("hello"), p("bye! ,,,*")));
  pm1.history.redo();
  pm1.history.redo();
  pm1.history.redo();
  conv(pm1, pm2, doc(p("hello! ...*"), p("bye! ,,,*")));
  pm1.history.undo();
  pm1.history.undo();
  conv(pm1, pm2, doc(p("hello!"), p("bye! ,,,*")));
  pm2.history.undo();
  conv(pm1, pm2, doc(p("hello!"), p("bye")));
}, { doc: doc(p("hello"), p("bye")) });

test("undo_deleted_event", function (pm1, pm2) {
  pm1.setTextSelection(6);
  type(pm1, "A");
  delay(pm1, function () {
    type(pm1, "B", 4);
    type(pm1, "C", 5);
    type(pm1, "D", 1);
    pm2.apply(pm2.tr.delete(2, 5));
  });
  conv(pm1, pm2, "DhoA");
  pm1.history.undo();
  conv(pm1, pm2, "ho");
  cmp(pm1.selection.head, 3);
}, { doc: doc(p("hello")) });

/* This is related to the TP_2 condition often referenced in OT
   literature -- if you insert at two points but then pull out the
   content between those points, are the inserts still ordered
   properly. Our algorithm does not guarantee this.

test("tp_2", (pm1, pm2, pm3) => {
  delay(pm1, () => {
    delay(pm3, () => {
      type(pm1, "x", 2)
      type(pm3, "y", 3)
      pm2.apply(pm2.tr.delete(2, 3))
    })
  })
  conv(pm1, pm2, pm3, doc(p("axyc")))
}, {doc: doc(p("abc"))}, 3)
*/