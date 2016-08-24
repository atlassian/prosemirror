"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require("./fragment");

var Fragment = _require.Fragment;

var _require2 = require("./mark");

var Mark = _require2.Mark;


function parseDOM(schema, dom, options) {
  var topNode = options.topNode;
  var top = new NodeBuilder(topNode ? topNode.type : schema.nodes.doc, topNode ? topNode.attrs : null, true);
  var state = new DOMParseState(schema, options, top);
  state.addAll(dom, null, options.from, options.to);
  return top.finish();
}
exports.parseDOM = parseDOM;

// : (ResolvedPos, DOMNode, ?Object) → Slice
// Parse a DOM fragment into a `Slice`, starting with the context at
// `$context`. If the DOM nodes are known to be 'open' (as in
// `Slice`), pass their left open depth as the `openLeft` option.
function parseDOMInContext($context, dom) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  var schema = $context.parent.type.schema;

  var _builderFromContext = builderFromContext($context);

  var builder = _builderFromContext.builder;
  var top = _builderFromContext.top;

  var openLeft = options.openLeft,
      startPos = $context.depth;

  new (function (_DOMParseState) {
    _inherits(_class, _DOMParseState);

    function _class() {
      _classCallCheck(this, _class);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(_class).apply(this, arguments));
    }

    _createClass(_class, [{
      key: "enter",
      value: function enter(type, attrs) {
        if (openLeft == null) openLeft = type.isTextblock ? 1 : 0;
        if (openLeft > 0 && this.top.match.matchType(type, attrs)) openLeft = 0;
        if (openLeft == 0) return _get(Object.getPrototypeOf(_class.prototype), "enter", this).call(this, type, attrs);

        openLeft--;
        return null;
      }
    }]);

    return _class;
  }(DOMParseState))(schema, options, builder).addAll(dom);

  var openTo = top.openDepth,
      doc = top.finish(openTo),
      $startPos = doc.resolve(startPos);
  for (var d = $startPos.depth; d >= 0 && startPos == $startPos.end(d); d--) {
    ++startPos;
  }return doc.slice(startPos, doc.content.size - openTo);
}
exports.parseDOMInContext = parseDOMInContext;

function builderFromContext($context) {
  var top = void 0,
      builder = void 0;
  for (var i = 0; i <= $context.depth; i++) {
    var node = $context.node(i),
        match = node.contentMatchAt($context.index(i));
    if (i == 0) builder = top = new NodeBuilder(node.type, node.attrs, true, null, match);else builder = builder.start(node.type, node.attrs, false, match);
  }
  return { builder: builder, top: top };
}

// ;; #path=ParseSpec #kind=interface
// A value that describes how to parse a given DOM node as a
// ProseMirror node or mark type. Specifies the attributes of the new
// node or mark, along with optional information about the way the
// node's content should be treated.
//
// May either be a set of attributes, where `null` indicates the
// node's default attributes, or an array containing first a set of
// attributes and then an object describing the treatment of the
// node's content. Such an object may have the following properties:
//
// **`content`**`: ?union<bool, DOMNode>`
//   : If this is `false`, the content will be ignored. If it is not
//     given, the DOM node's children will be parsed as content of the
//     ProseMirror node or mark. If it is a DOM node, that DOM node's
//     content is treated as the content of the new node or mark (this
//     is useful if, for example, your DOM representation puts its
//     child nodes in an inner wrapping node).
//
// **`preserveWhiteSpace`**`: ?bool`
//   : When given, this enables or disables preserving of whitespace
//     when parsing the content.

var NodeBuilder = function () {
  function NodeBuilder(type, attrs, solid, prev, match) {
    _classCallCheck(this, NodeBuilder);

    // : NodeType
    // The type of the node being built
    this.type = type;
    // : ContentMatch
    // The content match at this point, used to determine whether
    // other nodes may be added here.
    this.match = match || type.contentExpr.start(attrs);
    // : bool
    // True when the node is found in the source, and thus should be
    // preserved until its end. False when it was made up to provide a
    // wrapper for another node.
    this.solid = solid;
    // : [Node]
    // The nodes that have been added so far.
    this.content = [];
    // : ?NodeBuilder
    // The builder for the parent node, if any.
    this.prev = prev;
    // : ?NodeBuilder
    // The builder for the last child, if that is still open (see
    // `NodeBuilder.start`)
    this.openChild = null;
  }

  // : (Node) → ?Node
  // Try to add a node. Strip it of marks if necessary. Returns null
  // when the node doesn't fit here.


  _createClass(NodeBuilder, [{
    key: "add",
    value: function add(node) {
      var _this2 = this;

      var matched = this.match.matchNode(node);
      if (!matched && node.marks.length) {
        node = node.mark(node.marks.filter(function (mark) {
          return _this2.match.allowsMark(mark.type);
        }));
        matched = this.match.matchNode(node);
      }
      if (!matched) return null;
      this.closeChild();
      this.content.push(node);
      this.match = matched;
      return node;
    }

    // : (NodeType, ?Object, bool, ?ContentMatch) → ?NodeBuilder
    // Try to start a new node at this point.

  }, {
    key: "start",
    value: function start(type, attrs, solid, match) {
      var matched = this.match.matchType(type, attrs);
      if (!matched) return null;
      this.closeChild();
      this.match = matched;
      return this.openChild = new NodeBuilder(type, attrs, solid, this, match);
    }
  }, {
    key: "closeChild",
    value: function closeChild(openRight) {
      if (this.openChild) {
        this.content.push(this.openChild.finish(openRight && openRight - 1));
        this.openChild = null;
      }
    }

    // : ()
    // Strip any trailing space text from the builder's content.

  }, {
    key: "stripTrailingSpace",
    value: function stripTrailingSpace() {
      if (this.openChild) return;
      var last = this.content[this.content.length - 1],
          m = void 0;
      if (last && last.isText && (m = /\s+$/.exec(last.text))) {
        if (last.text.length == m[0].length) this.content.pop();else this.content[this.content.length - 1] = last.copy(last.text.slice(0, last.text.length - m[0].length));
      }
    }

    // : (?number) → Node
    // Finish this node. If `openRight` is > 0, the node (and `openRight
    // - 1` last children) is partial, and we don't need to 'close' it
    // by filling in required content.

  }, {
    key: "finish",
    value: function finish(openRight) {
      this.closeChild(openRight);
      var content = Fragment.from(this.content);
      if (!openRight) content = content.append(this.match.fillBefore(Fragment.empty, true));
      return this.type.create(this.match.attrs, content);
    }

    // : (NodeType, ?Object, ?Node) → ?NodeBuilder
    // Try to find a valid place to add a node with the given type and
    // attributes. When successful, if `node` was given, add it in its
    // entirety and return the builder to which it was added. If not,
    // start a node of the given type and return the builder for it.

  }, {
    key: "findPlace",
    value: function findPlace(type, attrs, node) {
      var route = void 0,
          builder = void 0;
      for (var top = this;; top = top.prev) {
        var found = top.match.findWrapping(type, attrs);
        if (found && (!route || route.length > found.length)) {
          route = found;
          builder = top;
          if (!found.length) break;
        }
        if (top.solid) break;
      }

      if (!route) return null;
      for (var i = 0; i < route.length; i++) {
        builder = builder.start(route[i].type, route[i].attrs, false);
      }return node ? builder.add(node) && builder : builder.start(type, attrs, true);
    }
  }, {
    key: "depth",
    get: function get() {
      var d = 0;
      for (var b = this.prev; b; b = b.prev) {
        d++;
      }return d;
    }
  }, {
    key: "openDepth",
    get: function get() {
      var d = 0;
      for (var c = this.openChild; c; c = c.openChild) {
        d++;
      }return d;
    }
  }, {
    key: "posBeforeLastChild",
    get: function get() {
      var pos = this.prev ? this.prev.posBeforeLastChild + 1 : 0;
      for (var i = 0; i < this.content.length; i++) {
        pos += this.content[i].nodeSize;
      }return pos;
    }
  }, {
    key: "currentPos",
    get: function get() {
      this.closeChild();
      return this.posBeforeLastChild;
    }
  }]);

  return NodeBuilder;
}();

// : Object<bool> The block-level tags in HTML5


var blockTags = {
  address: true, article: true, aside: true, blockquote: true, canvas: true,
  dd: true, div: true, dl: true, fieldset: true, figcaption: true, figure: true,
  footer: true, form: true, h1: true, h2: true, h3: true, h4: true, h5: true,
  h6: true, header: true, hgroup: true, hr: true, li: true, noscript: true, ol: true,
  output: true, p: true, pre: true, section: true, table: true, tfoot: true, ul: true
};

// : Object<bool> The tags that we normally ignore.
var ignoreTags = {
  head: true, noscript: true, object: true, script: true, style: true, title: true
};

// : Object<bool> List tags.
var listTags = { ol: true, ul: true };

// A state object used to track context during a parse.

var DOMParseState = function () {
  // : (Schema, Object, NodeBuilder)

  function DOMParseState(schema, options, top) {
    _classCallCheck(this, DOMParseState);

    // : Object The options passed to this parse.
    this.options = options || {};
    // : Schema The schema that we are parsing into.
    this.schema = schema;
    this.top = top;
    // : [Mark] The current set of marks
    this.marks = Mark.none;
    // : bool Whether to preserve whitespace
    this.preserveWhitespace = this.options.preserveWhitespace;
    this.info = schemaInfo(schema);
    this.find = options.findPositions;
  }

  // : (Mark) → [Mark]
  // Add a mark to the current set of marks, return the old set.


  _createClass(DOMParseState, [{
    key: "addMark",
    value: function addMark(mark) {
      var old = this.marks;
      this.marks = mark.addToSet(this.marks);
      return old;
    }

    // : (DOMNode)
    // Add a DOM node to the content. Text is inserted as text node,
    // otherwise, the node is passed to `addElement` or, if it has a
    // `style` attribute, `addElementWithStyles`.

  }, {
    key: "addDOM",
    value: function addDOM(dom) {
      if (dom.nodeType == 3) {
        var value = dom.nodeValue;
        var top = this.top;
        if (/\S/.test(value) || top.type.isTextblock) {
          if (!this.preserveWhitespace) {
            value = value.replace(/\s+/g, " ");
            // If this starts with whitespace, and there is either no node
            // before it or a node that ends with whitespace, strip the
            // leading space.
            if (/^\s/.test(value)) top.stripTrailingSpace();
          }
          if (value) this.insertNode(this.schema.text(value, this.marks));
          this.findInText(dom);
        } else {
          this.findInside(dom);
        }
      } else if (dom.nodeType == 1 && !dom.hasAttribute("pm-ignore")) {
        var style = dom.getAttribute("style");
        if (style) this.addElementWithStyles(parseStyles(style), dom);else this.addElement(dom);
      }
    }

    // : (DOMNode)
    // Try to find a handler for the given tag and use that to parse. If
    // none is found, the element's content nodes are added directly.

  }, {
    key: "addElement",
    value: function addElement(dom) {
      var name = dom.nodeName.toLowerCase();
      if (listTags.hasOwnProperty(name)) this.normalizeList(dom);
      // Ignore trailing BR nodes, which browsers create during editing
      if (this.options.editableContent && name == "br" && !dom.nextSibling) return;
      if (!this.parseNodeType(dom, name)) {
        if (ignoreTags.hasOwnProperty(name)) {
          this.findInside(dom);
        } else {
          var sync = blockTags.hasOwnProperty(name) && this.top;
          this.addAll(dom);
          if (sync) this.sync(sync);
        }
      }
    }

    // Run any style parser associated with the node's styles. After
    // that, if no style parser suppressed the node's content, pass it
    // through to `addElement`.

  }, {
    key: "addElementWithStyles",
    value: function addElementWithStyles(styles, dom) {
      var oldMarks = this.marks,
          marks = this.marks;
      for (var i = 0; i < styles.length; i += 2) {
        var result = matchStyle(this.info.styles, styles[i], styles[i + 1]);
        if (!result) continue;
        if (result.attrs === false) return;
        marks = result.mark.create(result.attrs).addToSet(marks);
      }
      this.marks = marks;
      this.addElement(dom);
      this.marks = oldMarks;
    }

    // (DOMNode, string) → bool
    // Look up a handler for the given node. If none are found, return
    // false. Otherwise, apply it, use its return value to drive the way
    // the node's content is wrapped, and return true.

  }, {
    key: "parseNodeType",
    value: function parseNodeType(dom) {
      var result = matchTag(this.info.selectors, dom);
      if (!result) return false;

      var sync = void 0,
          before = void 0;
      if (result.node) sync = this.enter(result.node, result.attrs);else before = this.addMark(result.mark.create(result.attrs));

      var contentNode = dom,
          preserve = null,
          prevPreserve = this.preserveWhitespace;
      if (result.content) {
        if (result.content.content === false) contentNode = null;else if (result.content.content) contentNode = result.content.content;
        preserve = result.content.preserveWhitespace;
      }

      if (contentNode) {
        this.findAround(dom, contentNode, true);
        if (preserve != null) this.preserveWhitespace = preserve;
        this.addAll(contentNode, sync);
        if (sync) this.sync(sync.prev);else if (before) this.marks = before;
        if (preserve != null) this.preserveWhitespace = prevPreserve;
        this.findAround(dom, contentNode, true);
      } else {
        this.findInside(parent);
      }
      return true;
    }

    // : (DOMNode, ?NodeBuilder, ?number, ?number)
    // Add all child nodes between `startIndex` and `endIndex` (or the
    // whole node, if not given). If `sync` is passed, use it to
    // synchronize after every block element.

  }, {
    key: "addAll",
    value: function addAll(parent, sync, startIndex, endIndex) {
      var index = startIndex || 0;
      for (var dom = startIndex ? parent.childNodes[startIndex] : parent.firstChild, end = endIndex == null ? null : parent.childNodes[endIndex]; dom != end; dom = dom.nextSibling, ++index) {
        this.findAtPoint(parent, index);
        this.addDOM(dom);
        if (sync && blockTags.hasOwnProperty(dom.nodeName.toLowerCase())) this.sync(sync);
      }
      this.findAtPoint(parent, index);
    }

    // : (Node) → ?Node
    // Try to insert the given node, adjusting the context when needed.

  }, {
    key: "insertNode",
    value: function insertNode(node) {
      var ok = this.top.findPlace(node.type, node.attrs, node);
      if (ok) {
        this.sync(ok);
        return true;
      }
    }

    // : (NodeType, ?Object, [Node]) → ?Node
    // Insert a node of the given type, with the given content, based on
    // `dom`, at the current position in the document.

  }, {
    key: "insert",
    value: function insert(type, attrs, content) {
      var node = type.createAndFill(attrs, content, type.isInline ? this.marks : null);
      if (node) this.insertNode(node);
    }

    // : (NodeType, ?Object) → ?NodeBuilder
    // Try to start a node of the given type, adjusting the context when
    // necessary.

  }, {
    key: "enter",
    value: function enter(type, attrs) {
      var ok = this.top.findPlace(type, attrs);
      if (ok) {
        this.sync(ok);
        return ok;
      }
    }

    // : ()
    // Leave the node currently at the top.

  }, {
    key: "leave",
    value: function leave() {
      if (!this.preserveWhitespace) this.top.stripTrailingSpace();
      this.top = this.top.prev;
    }
  }, {
    key: "sync",
    value: function sync(to) {
      for (;;) {
        for (var cur = to; cur; cur = cur.prev) {
          if (cur == this.top) {
            this.top = to;
            return;
          }
        }this.leave();
      }
    }

    // Kludge to work around directly nested list nodes produced by some
    // tools and allowed by browsers to mean that the nested list is
    // actually part of the list item above it.

  }, {
    key: "normalizeList",
    value: function normalizeList(dom) {
      for (var child = dom.firstChild, prev; child; child = child.nextSibling) {
        if (child.nodeType == 1 && listTags.hasOwnProperty(child.nodeName.toLowerCase()) && (prev = child.previousSibling)) {
          prev.appendChild(child);
          child = prev;
        }
      }
    }
  }, {
    key: "findAtPoint",
    value: function findAtPoint(parent, offset) {
      if (this.find) for (var i = 0; i < this.find.length; i++) {
        if (this.find[i].node == parent && this.find[i].offset == offset) this.find[i].pos = this.top.currentPos;
      }
    }
  }, {
    key: "findInside",
    value: function findInside(parent) {
      if (this.find) for (var i = 0; i < this.find.length; i++) {
        if (this.find[i].pos == null && parent.contains(this.find[i].node)) this.find[i].pos = this.top.currentPos;
      }
    }
  }, {
    key: "findAround",
    value: function findAround(parent, content, before) {
      if (parent != content && this.find) for (var i = 0; i < this.find.length; i++) {
        if (this.find[i].pos == null && parent.contains(this.find[i].node)) {
          var pos = content.compareDocumentPosition(this.find[i].node);
          if (pos & (before ? 2 : 4)) this.find[i].pos = this.top.currentPos;
        }
      }
    }
  }, {
    key: "findInText",
    value: function findInText(textNode) {
      if (this.find) for (var i = 0; i < this.find.length; i++) {
        if (this.find[i].node == textNode) this.find[i].pos = this.top.currentPos - (textNode.nodeValue.length - this.find[i].offset);
      }
    }
  }]);

  return DOMParseState;
}();

// Apply a CSS selector.


function matches(dom, selector) {
  return (dom.matches || dom.msMatchesSelector || dom.webkitMatchesSelector || dom.mozMatchesSelector).call(dom, selector);
}

// : (string) → [string]
// Tokenize a style attribute into property/value pairs.
function parseStyles(style) {
  var re = /\s*([\w-]+)\s*:\s*([^;]+)/g,
      m = void 0,
      result = [];
  while (m = re.exec(style)) {
    result.push(m[1], m[2].trim());
  }return result;
}

function schemaInfo(schema) {
  return schema.cached.parseDOMInfo || (schema.cached.parseDOMInfo = summarizeSchemaInfo(schema));
}

function summarizeSchemaInfo(schema) {
  var selectors = [],
      styles = [];
  for (var name in schema.nodes) {
    var type = schema.nodes[name],
        match = type.matchDOMTag;
    if (match) for (var selector in match) {
      selectors.push({ selector: selector, node: type, value: match[selector] });
    }
  }
  for (var _name in schema.marks) {
    var _type = schema.marks[_name],
        _match = _type.matchDOMTag,
        props = _type.matchDOMStyle;
    if (_match) for (var _selector in _match) {
      selectors.push({ selector: _selector, mark: _type, value: _match[_selector] });
    }if (props) for (var prop in props) {
      styles.push({ prop: prop, mark: _type, value: props[prop] });
    }
  }
  return { selectors: selectors, styles: styles };
}

function matchTag(selectors, dom) {
  for (var i = 0; i < selectors.length; i++) {
    var cur = selectors[i];
    if (matches(dom, cur.selector)) {
      var value = cur.value,
          content = void 0;
      if (value instanceof Function) {
        value = value(dom);
        if (value === false) continue;
      }
      if (Array.isArray(value)) {
        ;var _value = value;

        var _value2 = _slicedToArray(_value, 2);

        value = _value2[0];
        content = _value2[1];
      }
      return { node: cur.node, mark: cur.mark, attrs: value, content: content };
    }
  }
}

function matchStyle(styles, prop, value) {
  for (var i = 0; i < styles.length; i++) {
    var cur = styles[i];
    if (cur.prop == prop) {
      var attrs = cur.value;
      if (attrs instanceof Function) {
        attrs = attrs(value);
        if (attrs === false) continue;
      }
      return { mark: cur.mark, attrs: attrs };
    }
  }
}