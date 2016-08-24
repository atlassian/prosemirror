"use strict";

var _require = require("../../edit/domchange");

var readInputChange = _require.readInputChange;
var readCompositionChange = _require.readCompositionChange;

var _require2 = require("./def");

var namespace = _require2.namespace;

var _require3 = require("../build");

var doc = _require3.doc;
var p = _require3.p;
var h1 = _require3.h1;
var em = _require3.em;
var img = _require3.img;
var strong = _require3.strong;
var blockquote = _require3.blockquote;

var _require4 = require("../cmp");

var cmpNode = _require4.cmpNode;
var cmp = _require4.cmp;

var _require5 = require("./test-selection");

var findTextNode = _require5.findTextNode;


function setSel(aNode, aOff, fNode, fOff) {
  var r = document.createRange(),
      s = window.getSelection();
  r.setEnd(fNode || aNode, fNode ? fOff : aOff);
  r.setStart(aNode, aOff);
  s.removeAllRanges();
  s.addRange(r);
}

var test = namespace("domchange", { doc: doc(p("hello")) });

test("add_text", function (pm) {
  findTextNode(pm.content, "hello").nodeValue = "heLllo";
  readInputChange(pm);
  cmpNode(pm.doc, doc(p("heLllo")));
});

test("remove_text", function (pm) {
  findTextNode(pm.content, "hello").nodeValue = "heo";
  readInputChange(pm);
  cmpNode(pm.doc, doc(p("heo")));
});

test("remove_ambiguous_text", function (pm) {
  findTextNode(pm.content, "hello").nodeValue = "helo";
  readInputChange(pm);
  cmpNode(pm.doc, doc(p("helo")));
});

test("active_marks", function (pm) {
  pm.addActiveMark(pm.schema.marks.em.create());
  findTextNode(pm.content, "hello").nodeValue = "helloo";
  readInputChange(pm);
  cmpNode(pm.doc, doc(p("hello", em("o"))));
});

test("add_node", function (pm) {
  var txt = findTextNode(pm.content, "hello");
  txt.parentNode.appendChild(document.createTextNode("!"));
  readInputChange(pm);
  cmpNode(pm.doc, doc(p("hello!")));
});

test("kill_node", function (pm) {
  var txt = findTextNode(pm.content, "hello");
  txt.parentNode.removeChild(txt);
  readInputChange(pm);
  cmpNode(pm.doc, doc(p()));
});

test("add_paragraph", function (pm) {
  pm.content.insertBefore(document.createElement("p"), pm.content.firstChild).appendChild(document.createTextNode("hey"));
  readInputChange(pm);
  cmpNode(pm.doc, doc(p("hey"), p("hello")));
});

test("add_duplicate_paragraph", function (pm) {
  pm.content.insertBefore(document.createElement("p"), pm.content.firstChild).appendChild(document.createTextNode("hello"));
  readInputChange(pm);
  cmpNode(pm.doc, doc(p("hello"), p("hello")));
});

test("add_repeated_text", function (pm) {
  findTextNode(pm.content, "hello").nodeValue = "helhello";
  readInputChange(pm);
  cmpNode(pm.doc, doc(p("helhello")));
});

test("detect_enter", function (pm) {
  pm.flush();
  var bq = pm.content.querySelector("blockquote");
  bq.appendChild(document.createElement("p"));
  readInputChange(pm);
  cmpNode(pm.doc, doc(blockquote(p("foo")), p()));
}, { doc: doc(blockquote(p("foo"), p("<a>"))) });

test("composition_simple", function (pm) {
  findTextNode(pm.content, "hello").nodeValue = "hellox";
  pm.startOperation();
  readCompositionChange(pm, 0);
  cmpNode(pm.doc, doc(p("hellox")));
});

test("composition_del_inside_markup", function (pm) {
  pm.flush();
  findTextNode(pm.content, "cd").nodeValue = "c";
  pm.startOperation();
  readCompositionChange(pm, 0);
  cmpNode(pm.doc, doc(p("a", em("b", img, strong("c")), "e")));
}, { doc: doc(p("a", em("b", img, strong("cd<a>")), "e")) });

test("composition_type_inside_markup", function (pm) {
  pm.flush();
  findTextNode(pm.content, "cd").nodeValue = "cdxy";
  pm.startOperation();
  readCompositionChange(pm, 0);
  cmpNode(pm.doc, doc(p("a", em("b", img, strong("cdxy")), "e")));
}, { doc: doc(p("a", em("b", img, strong("cd<a>")), "e")) });

test("composition_type_ambiguous", function (pm) {
  pm.flush();
  pm.addActiveMark(pm.schema.marks.strong.create());
  findTextNode(pm.content, "foo").nodeValue = "fooo";
  pm.startOperation();
  readCompositionChange(pm, 0);
  cmpNode(pm.doc, doc(p("fo", strong("o"), "o")));
}, { doc: doc(p("fo<a>o")) });

test("get_selection", function (pm) {
  var textNode = findTextNode(pm.content, "abc");
  textNode.nodeValue = "abcd";
  setSel(textNode, 3);
  readInputChange(pm);
  cmpNode(pm.doc, doc(p("abcd")));
  cmp(pm.selection.anchor, 4);
  cmp(pm.selection.head, 4);
}, { doc: doc(p("abc<a>")) });

test("crude_split", function (pm) {
  pm.flush();
  var para = pm.content.querySelector("p");
  var split = para.parentNode.appendChild(para.cloneNode());
  split.innerHTML = "fg";
  findTextNode(para, "defg").nodeValue = "dexy";
  setSel(split.firstChild, 1);
  readInputChange(pm);
  cmpNode(pm.doc, doc(h1("abc"), p("dexy"), p("fg")));
  cmp(pm.selection.anchor, 13);
}, { doc: doc(h1("abc"), p("defg<a>")) });

test("deep_split", function (pm) {
  pm.flush();
  var quote = pm.content.querySelector("blockquote");
  var quote2 = pm.content.appendChild(quote.cloneNode(true));
  findTextNode(quote, "abcd").nodeValue = "abx";
  var text2 = findTextNode(quote2, "abcd");
  text2.nodeValue = "cd";
  setSel(text2.parentNode, 0);
  readInputChange(pm);
  cmpNode(pm.doc, doc(blockquote(p("abx")), blockquote(p("cd"))));
  cmp(pm.selection.anchor, 9);
}, { doc: doc(blockquote(p("ab<a>cd"))) });