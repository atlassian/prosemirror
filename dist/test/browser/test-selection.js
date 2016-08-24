"use strict";

var _require = require("./def");

var namespace = _require.namespace;

var _require2 = require("../build");

var doc = _require2.doc;
var blockquote = _require2.blockquote;
var p = _require2.p;
var em = _require2.em;
var img = _require2.img;
var strong = _require2.strong;
var code = _require2.code;
var br = _require2.br;
var hr = _require2.hr;

var _require3 = require("../cmp");

var cmp = _require3.cmp;
var cmpNode = _require3.cmpNode;
var gt = _require3.gt;


function allPositions(doc) {
  var found = [];
  function scan(node, start) {
    if (node.isTextblock) {
      for (var i = 0; i <= node.content.size; i++) {
        found.push(start + i);
      }
    } else {
      node.forEach(function (child, offset) {
        return scan(child, start + offset + 1);
      });
    }
  }
  scan(doc, 0);
  return found;
}

var test = namespace("selection");

function findTextNode(node, text) {
  if (node.nodeType == 3) {
    if (node.nodeValue == text) return node;
  } else if (node.nodeType == 1) {
    for (var ch = node.firstChild; ch; ch = ch.nextSibling) {
      var found = findTextNode(ch, text);
      if (found) return found;
    }
  }
}
exports.findTextNode = findTextNode;

function setSel(node, offset) {
  var range = document.createRange();
  range.setEnd(node, offset);
  range.setStart(node, offset);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

test("read", function (pm) {
  // disabled when the document doesn't have focus, since that causes this to fail
  if (!document.hasFocus()) return;
  function test(node, offset, expected, comment) {
    setSel(node, offset);
    pm.sel.readFromDOM();
    var sel = pm.selection;
    cmp(sel.head == null ? sel.from : sel.head, expected, comment);
    pm.flush();
  }
  var one = findTextNode(pm.content, "one");
  var two = findTextNode(pm.content, "two");
  test(one, 0, 1, "force 0:0");
  test(one, 1, 2, "force 0:1");
  test(one, 3, 4, "force 0:3");
  test(one.parentNode, 0, 1, "force :0 from one");
  test(one.parentNode, 1, 4, "force :1 from one");
  test(two, 0, 8, "force 1:0");
  test(two, 3, 11, "force 1:3");
  test(two.parentNode, 1, 11, "force :1 from two");
  test(pm.content, 1, 4, "force :1");
  test(pm.content, 1, 5, "force :1");
  test(pm.content, 2, 8, "force :2");
  test(pm.content, 3, 11, "force :3");
}, {
  doc: doc(p("one"), hr, blockquote(p("two")))
});

function getSel() {
  var sel = window.getSelection();
  var node = sel.focusNode,
      offset = sel.focusOffset;
  while (node && node.nodeType != 3) {
    var after = offset < node.childNodes.length && node.childNodes[offset];
    var before = offset > 0 && node.childNodes[offset - 1];
    if (after) {
      node = after;offset = 0;
    } else if (before) {
      node = before;offset = node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
    } else break;
  }
  return { node: node, offset: offset };
}

test("set", function (pm) {
  // disabled when the document doesn't have focus, since that causes this to fail
  if (!document.hasFocus()) return;
  function test(pos, node, offset) {
    pm.setTextSelection(pos);
    pm.flush();
    var sel = getSel();
    cmp(sel.node, node, pos);
    cmp(sel.offset, offset, pos);
  }
  var one = findTextNode(pm.content, "one");
  var two = findTextNode(pm.content, "two");
  pm.focus();
  test(1, one, 0);
  test(2, one, 1);
  test(4, one, 3);
  test(8, two, 0);
  test(10, two, 2);
}, {
  doc: doc(p("one"), hr, blockquote(p("two")))
});

test("change_event", function (pm) {
  var received = 0;
  pm.on.selectionChange.add(function () {
    return ++received;
  });
  pm.setTextSelection(2);
  pm.setTextSelection(2);
  cmp(received, 1, "changed");
  pm.setTextSelection(1);
  cmp(received, 2, "changed back");
  pm.setDoc(doc(p("hi")));
  cmp(received, 2, "new doc");
  pm.tr.insertText(3, "you").apply();
  cmp(received, 3, "doc changed");
}, { doc: doc(p("one")) });

test("coords_order", function (pm) {
  var p00 = pm.coordsAtPos(1);
  var p01 = pm.coordsAtPos(2);
  var p03 = pm.coordsAtPos(4);
  var p10 = pm.coordsAtPos(6);
  var p13 = pm.coordsAtPos(9);

  gt(p00.bottom, p00.top);
  gt(p13.bottom, p13.top);

  cmp(p00.top, p01.top);
  cmp(p01.top, p03.top);
  cmp(p00.bottom, p03.bottom);
  cmp(p10.top, p13.top);

  gt(p01.left, p00.left);
  gt(p03.left, p01.left);
  gt(p10.top, p00.top);
  gt(p13.left, p10.left);
}, {
  doc: doc(p("one"), p("two"))
});

test("coords_cornercases", function (pm) {
  pm.markRange(2, 5, { className: "foo" });
  pm.markRange(7, 13, { className: "foo" });
  allPositions(pm.doc).forEach(function (pos) {
    var coords = pm.coordsAtPos(pos);
    var found = pm.posAtCoords(coords);
    cmp(found, pos);
    pm.setTextSelection(pos);
    pm.flush();
  });
}, {
  doc: doc(p("one", em("two", strong("three"), img), br, code("foo")), p())
});

test("coords_round_trip", function (pm) {
  ;[1, 2, 4, 7, 14, 15].forEach(function (pos) {
    var coords = pm.coordsAtPos(pos);
    var found = pm.posAtCoords(coords);
    cmp(found, pos);
  });
}, {
  doc: doc(p("one"), blockquote(p("two"), p("three")))
});

test("follow_change", function (pm) {
  pm.tr.insertText(1, "xy").apply();
  cmp(pm.selection.head, 3);
  cmp(pm.selection.anchor, 3);
  pm.tr.insertText(1, "zq").apply();
  cmp(pm.selection.head, 5);
  cmp(pm.selection.anchor, 5);
  pm.tr.insertText(7, "uv").apply();
  cmp(pm.selection.head, 5);
  cmp(pm.selection.anchor, 5);
}, {
  doc: doc(p("hi"))
});

test("replace_with_block", function (pm) {
  pm.setTextSelection(4);
  pm.tr.replaceSelection(pm.schema.node("horizontal_rule")).apply();
  cmpNode(pm.doc, doc(p("foo"), hr, p("bar")), "split paragraph");
  cmp(pm.selection.head, 7, "moved after rule");
  pm.setTextSelection(10);
  pm.tr.replaceSelection(pm.schema.node("horizontal_rule")).apply();
  cmpNode(pm.doc, doc(p("foo"), hr, p("bar"), hr), "inserted after");
  cmp(pm.selection.from, 11, "selected hr");
}, {
  doc: doc(p("foobar"))
});

test("type_over_hr", function (pm) {
  pm.input.insertText(pm.selection.from, pm.selection.to, "x");
  cmpNode(pm.doc, doc(p("a"), p("x"), p("b")));
  cmp(pm.selection.head, 5);
  cmp(pm.selection.anchor, 5);
}, { doc: doc(p("a"), "<a>", hr, p("b")) });

test("pos_at_coords_after_wrapped", function (pm) {
  var top = pm.coordsAtPos(1),
      pos = 1,
      end = void 0;
  for (;;) {
    pm.tr.typeText("abc def ghi ").apply();
    pos += 12;
    end = pm.coordsAtPos(pos);
    if (end.bottom > top.bottom + 4) break;
  }
  cmp(pm.posAtCoords({ left: end.left + 50, top: end.top + 5 }), pos);
});