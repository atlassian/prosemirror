"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("../util/dom");

var contains = _require.contains;

var browser = require("../util/browser");

var _require2 = require("./dompos");

var posFromDOM = _require2.posFromDOM;
var DOMAfterPos = _require2.DOMAfterPos;
var DOMFromPos = _require2.DOMFromPos;
var coordsAtPos = _require2.coordsAtPos;

// Track the state of the current editor selection. Keeps the editor
// selection in sync with the DOM selection by polling for changes,
// as there is no DOM event for DOM selection changes.

var SelectionState = function () {
  function SelectionState(pm, range) {
    var _this = this;

    _classCallCheck(this, SelectionState);

    this.pm = pm;
    // The current editor selection.
    this.range = range;

    // The timeout ID for the poller when active.
    this.polling = null;
    // Track the state of the DOM selection.
    this.lastAnchorNode = this.lastHeadNode = this.lastAnchorOffset = this.lastHeadOffset = null;
    // The corresponding DOM node when a node selection is active.
    this.lastNode = null;

    pm.content.addEventListener("focus", function () {
      return _this.receivedFocus();
    });

    this.poller = this.poller.bind(this);
  }

  // : (Selection, boolean)
  // Set the current selection and signal an event on the editor.


  _createClass(SelectionState, [{
    key: "setAndSignal",
    value: function setAndSignal(range, clearLast) {
      this.set(range, clearLast);
      this.pm.on.selectionChange.dispatch();
    }

    // : (Selection, boolean)
    // Set the current selection.

  }, {
    key: "set",
    value: function set(range, clearLast) {
      this.pm.ensureOperation({ readSelection: false, selection: range });
      this.range = range;
      if (clearLast !== false) this.lastAnchorNode = null;
    }
  }, {
    key: "poller",
    value: function poller() {
      if (hasFocus(this.pm)) {
        if (!this.pm.operation) this.readFromDOM();
        this.polling = setTimeout(this.poller, 100);
      } else {
        this.polling = null;
      }
    }
  }, {
    key: "startPolling",
    value: function startPolling() {
      clearTimeout(this.polling);
      this.polling = setTimeout(this.poller, 50);
    }
  }, {
    key: "fastPoll",
    value: function fastPoll() {
      this.startPolling();
    }
  }, {
    key: "stopPolling",
    value: function stopPolling() {
      clearTimeout(this.polling);
      this.polling = null;
    }

    // : () → bool
    // Whether the DOM selection has changed from the last known state.

  }, {
    key: "domChanged",
    value: function domChanged() {
      var sel = this.pm.root.getSelection();
      return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset || sel.focusNode != this.lastHeadNode || sel.focusOffset != this.lastHeadOffset;
    }

    // Store the current state of the DOM selection.

  }, {
    key: "storeDOMState",
    value: function storeDOMState() {
      var sel = this.pm.root.getSelection();
      this.lastAnchorNode = sel.anchorNode;this.lastAnchorOffset = sel.anchorOffset;
      this.lastHeadNode = sel.focusNode;this.lastHeadOffset = sel.focusOffset;
    }

    // : () → bool
    // When the DOM selection changes in a notable manner, modify the
    // current selection state to match.

  }, {
    key: "readFromDOM",
    value: function readFromDOM() {
      if (!hasFocus(this.pm) || !this.domChanged()) return false;

      var _selectionFromDOM = selectionFromDOM(this.pm, this.range.head);

      var range = _selectionFromDOM.range;
      var adjusted = _selectionFromDOM.adjusted;

      this.setAndSignal(range);

      if (range instanceof NodeSelection || adjusted) {
        this.toDOM();
      } else {
        this.clearNode();
        this.storeDOMState();
      }
      return true;
    }
  }, {
    key: "toDOM",
    value: function toDOM(takeFocus) {
      if (!hasFocus(this.pm)) {
        if (!takeFocus) return;
        // See https://bugzilla.mozilla.org/show_bug.cgi?id=921444
        else if (browser.gecko) this.pm.content.focus();
      }
      if (this.range instanceof NodeSelection) this.nodeToDOM();else this.rangeToDOM();
    }

    // Make changes to the DOM for a node selection.

  }, {
    key: "nodeToDOM",
    value: function nodeToDOM() {
      var dom = DOMAfterPos(this.pm, this.range.from);
      if (dom != this.lastNode) {
        this.clearNode();
        dom.classList.add("ProseMirror-selectednode");
        this.pm.content.classList.add("ProseMirror-nodeselection");
        this.lastNode = dom;
      }
      var range = document.createRange(),
          sel = this.pm.root.getSelection();
      range.selectNode(dom);
      sel.removeAllRanges();
      sel.addRange(range);
      this.storeDOMState();
    }

    // Make changes to the DOM for a text selection.

  }, {
    key: "rangeToDOM",
    value: function rangeToDOM() {
      this.clearNode();

      var anchor = DOMFromPos(this.pm, this.range.anchor);
      var head = DOMFromPos(this.pm, this.range.head);

      var sel = this.pm.root.getSelection(),
          range = document.createRange();
      if (sel.extend) {
        range.setEnd(anchor.node, anchor.offset);
        range.collapse(false);
      } else {
        if (this.range.anchor > this.range.head) {
          var tmp = anchor;anchor = head;head = tmp;
        }
        range.setEnd(head.node, head.offset);
        range.setStart(anchor.node, anchor.offset);
      }
      sel.removeAllRanges();
      sel.addRange(range);
      if (sel.extend) sel.extend(head.node, head.offset);
      this.storeDOMState();
    }

    // Clear all DOM statefulness of the last node selection.

  }, {
    key: "clearNode",
    value: function clearNode() {
      if (this.lastNode) {
        this.lastNode.classList.remove("ProseMirror-selectednode");
        this.pm.content.classList.remove("ProseMirror-nodeselection");
        this.lastNode = null;
        return true;
      }
    }
  }, {
    key: "receivedFocus",
    value: function receivedFocus() {
      if (this.polling == null) this.startPolling();
    }
  }]);

  return SelectionState;
}();

exports.SelectionState = SelectionState;

// ;; An editor selection. Can be one of two selection types:
// `TextSelection` or `NodeSelection`. Both have the properties
// listed here, but also contain more information (such as the
// selected [node](#NodeSelection.node) or the
// [head](#TextSelection.head) and [anchor](#TextSelection.anchor)).

var Selection = function () {
  _createClass(Selection, [{
    key: "from",

    // :: number
    // The left bound of the selection.
    get: function get() {
      return this.$from.pos;
    }

    // :: number
    // The right bound of the selection.

  }, {
    key: "to",
    get: function get() {
      return this.$to.pos;
    }
  }]);

  function Selection($from, $to) {
    _classCallCheck(this, Selection);

    // :: ResolvedPos
    // The resolved left bound of the selection
    this.$from = $from;
    // :: ResolvedPos
    // The resolved right bound of the selection
    this.$to = $to;
  }

  // :: bool
  // True if the selection is an empty text selection (head an anchor
  // are the same).


  _createClass(Selection, [{
    key: "empty",
    get: function get() {
      return this.from == this.to;
    }

    // :: (other: Selection) → bool #path=Selection.prototype.eq
    // Test whether the selection is the same as another selection.

    // :: (doc: Node, mapping: Mappable) → Selection #path=Selection.prototype.map
    // Map this selection through a [mappable](#Mappable) thing. `doc`
    // should be the new document, to which we are mapping.

  }]);

  return Selection;
}();

exports.Selection = Selection;

// ;; A text selection represents a classical editor
// selection, with a head (the moving side) and anchor (immobile
// side), both of which point into textblock nodes. It can be empty (a
// regular cursor position).

var TextSelection = function (_Selection) {
  _inherits(TextSelection, _Selection);

  _createClass(TextSelection, [{
    key: "anchor",

    // :: number
    // The selection's immobile side (does not move when pressing
    // shift-arrow).
    get: function get() {
      return this.$anchor.pos;
    }
    // :: number
    // The selection's mobile side (the side that moves when pressing
    // shift-arrow).

  }, {
    key: "head",
    get: function get() {
      return this.$head.pos;
    }

    // :: (ResolvedPos, ?ResolvedPos)
    // Construct a text selection. When `head` is not given, it defaults
    // to `anchor`.

  }]);

  function TextSelection($anchor) {
    var $head = arguments.length <= 1 || arguments[1] === undefined ? $anchor : arguments[1];

    _classCallCheck(this, TextSelection);

    var inv = $anchor.pos > $head.pos;

    // :: ResolvedPos The resolved anchor of the selection.

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(TextSelection).call(this, inv ? $head : $anchor, inv ? $anchor : $head));

    _this2.$anchor = $anchor;
    // :: ResolvedPos The resolved head of the selection.
    _this2.$head = $head;
    return _this2;
  }

  _createClass(TextSelection, [{
    key: "eq",
    value: function eq(other) {
      return other instanceof TextSelection && other.head == this.head && other.anchor == this.anchor;
    }
  }, {
    key: "map",
    value: function map(doc, mapping) {
      var $head = doc.resolve(mapping.map(this.head));
      if (!$head.parent.isTextblock) return findSelectionNear($head);
      var $anchor = doc.resolve(mapping.map(this.anchor));
      return new TextSelection($anchor.parent.isTextblock ? $anchor : $head, $head);
    }
  }, {
    key: "inverted",
    get: function get() {
      return this.anchor > this.head;
    }
  }, {
    key: "token",
    get: function get() {
      return new SelectionToken(TextSelection, this.anchor, this.head);
    }
  }], [{
    key: "mapToken",
    value: function mapToken(token, mapping) {
      return new SelectionToken(TextSelection, mapping.map(token.a), mapping.map(token.b));
    }
  }, {
    key: "fromToken",
    value: function fromToken(token, doc) {
      var $head = doc.resolve(token.b);
      if (!$head.parent.isTextblock) return findSelectionNear($head);
      var $anchor = doc.resolve(token.a);
      return new TextSelection($anchor.parent.isTextblock ? $anchor : $head, $head);
    }
  }]);

  return TextSelection;
}(Selection);

exports.TextSelection = TextSelection;

// ;; A node selection is a selection that points at a
// single node. All nodes marked [selectable](#NodeType.selectable)
// can be the target of a node selection. In such an object, `from`
// and `to` point directly before and after the selected node.

var NodeSelection = function (_Selection2) {
  _inherits(NodeSelection, _Selection2);

  // :: (ResolvedPos)
  // Create a node selection. Does not verify the validity of its
  // argument. Use `ProseMirror.setNodeSelection` for an easier,
  // error-checking way to create a node selection.

  function NodeSelection($from) {
    _classCallCheck(this, NodeSelection);

    var $to = $from.plusOne();

    // :: Node The selected node.

    var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(NodeSelection).call(this, $from, $to));

    _this3.node = $from.nodeAfter;
    return _this3;
  }

  _createClass(NodeSelection, [{
    key: "eq",
    value: function eq(other) {
      return other instanceof NodeSelection && this.from == other.from;
    }
  }, {
    key: "map",
    value: function map(doc, mapping) {
      var $from = doc.resolve(mapping.map(this.from, 1));
      var to = mapping.map(this.to, -1);
      var node = $from.nodeAfter;
      if (node && to == $from.pos + node.nodeSize && node.type.selectable) return new NodeSelection($from);
      return findSelectionNear($from);
    }
  }, {
    key: "token",
    get: function get() {
      return new SelectionToken(NodeSelection, this.from, this.to);
    }
  }], [{
    key: "mapToken",
    value: function mapToken(token, mapping) {
      return new SelectionToken(NodeSelection, mapping.map(token.a, 1), mapping.map(token.b, -1));
    }
  }, {
    key: "fromToken",
    value: function fromToken(token, doc) {
      var $from = doc.resolve(token.a),
          node = $from.nodeAfter;
      if (node && token.b == token.a + node.nodeSize && node.type.selectable) return new NodeSelection($from);
      return findSelectionNear($from);
    }
  }]);

  return NodeSelection;
}(Selection);

exports.NodeSelection = NodeSelection;

var SelectionToken = function SelectionToken(type, a, b) {
  _classCallCheck(this, SelectionToken);

  this.type = type;
  this.a = a;
  this.b = b;
};

function isCollapsed(sel) {
  // Selection.isCollapsed is broken in Chrome 52.
  return sel.focusNode === sel.anchorNode && sel.focusOffset === sel.anchorOffset;
}
exports.isCollapsed = isCollapsed;

function selectionFromDOM(pm, oldHead) {
  var sel = pm.root.getSelection();
  var doc = pm.doc;
  var anchor = posFromDOM(sel.anchorNode, sel.anchorOffset);
  var head = isCollapsed(sel) ? anchor : posFromDOM(sel.focusNode, sel.focusOffset);

  var range = findSelectionNear(doc.resolve(head), oldHead != null && oldHead < head ? 1 : -1);
  if (range instanceof TextSelection) {
    var selNearAnchor = findSelectionNear(doc.resolve(anchor), anchor > range.to ? -1 : 1, true);
    range = new TextSelection(selNearAnchor.$anchor, range.$head);
  } else if (anchor < range.from || anchor > range.to) {
    // If head falls on a node, but anchor falls outside of it,
    // create a text selection between them
    var inv = anchor > range.to;
    range = new TextSelection(findSelectionNear(doc.resolve(anchor), inv ? -1 : 1, true).$anchor, findSelectionNear(inv ? range.$from : range.$to, inv ? 1 : -1, true).$head);
  }
  return { range: range, adjusted: head != range.head || anchor != range.anchor };
}

function hasFocus(pm) {
  if (pm.root.activeElement != pm.content) return false;
  var sel = pm.root.getSelection();
  return sel.rangeCount && contains(pm.content, sel.anchorNode);
}
exports.hasFocus = hasFocus;

// Try to find a selection inside the given node. `pos` points at the
// position where the search starts. When `text` is true, only return
// text selections.
function findSelectionIn(doc, node, pos, index, dir, text) {
  if (node.isTextblock) return new TextSelection(doc.resolve(pos));
  for (var i = index - (dir > 0 ? 0 : 1); dir > 0 ? i < node.childCount : i >= 0; i += dir) {
    var child = node.child(i);
    if (!child.type.isLeaf) {
      var inner = findSelectionIn(doc, child, pos + dir, dir < 0 ? child.childCount : 0, dir, text);
      if (inner) return inner;
    } else if (!text && child.type.selectable) {
      return new NodeSelection(doc.resolve(pos - (dir < 0 ? child.nodeSize : 0)));
    }
    pos += child.nodeSize * dir;
  }
}

// FIXME we'll need some awareness of text direction when scanning for selections

// Create a selection which is moved relative to a position in a
// given direction. When a selection isn't found at the given position,
// walks up the document tree one level and one step in the
// desired direction.
function findSelectionFrom($pos, dir, text) {
  var inner = $pos.parent.isTextblock ? new TextSelection($pos) : findSelectionIn($pos.node(0), $pos.parent, $pos.pos, $pos.index(), dir, text);
  if (inner) return inner;

  for (var depth = $pos.depth - 1; depth >= 0; depth--) {
    var found = dir < 0 ? findSelectionIn($pos.node(0), $pos.node(depth), $pos.before(depth + 1), $pos.index(depth), dir, text) : findSelectionIn($pos.node(0), $pos.node(depth), $pos.after(depth + 1), $pos.index(depth) + 1, dir, text);
    if (found) return found;
  }
}
exports.findSelectionFrom = findSelectionFrom;

function findSelectionNear($pos) {
  var bias = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
  var text = arguments[2];

  var result = findSelectionFrom($pos, bias, text) || findSelectionFrom($pos, -bias, text);
  if (!result) throw new RangeError("Searching for selection in invalid document " + $pos.node(0));
  return result;
}
exports.findSelectionNear = findSelectionNear;

// Find the selection closest to the start of the given node. `pos`,
// if given, should point at the start of the node's content.
function findSelectionAtStart(doc, text) {
  return findSelectionIn(doc, doc, 0, 0, 1, text);
}
exports.findSelectionAtStart = findSelectionAtStart;

// Find the selection closest to the end of the given node.
function findSelectionAtEnd(doc, text) {
  return findSelectionIn(doc, doc, doc.content.size, doc.childCount, -1, text);
}
exports.findSelectionAtEnd = findSelectionAtEnd;

// : (ProseMirror, number, number)
// Whether vertical position motion in a given direction
// from a position would leave a text block.
function verticalMotionLeavesTextblock(pm, $pos, dir) {
  var dom = $pos.depth ? DOMAfterPos(pm, $pos.before()) : pm.content;
  var coords = coordsAtPos(pm, $pos.pos);
  for (var child = dom.firstChild; child; child = child.nextSibling) {
    if (child.nodeType != 1) continue;
    var boxes = child.getClientRects();
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      if (dir < 0 ? box.bottom < coords.top : box.top > coords.bottom) return false;
    }
  }
  return true;
}
exports.verticalMotionLeavesTextblock = verticalMotionLeavesTextblock;