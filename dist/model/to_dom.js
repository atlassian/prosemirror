"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// ;; #path=DOMOutputSpec #kind=interface
// A description of a DOM structure. Can be either a string, which is
// interpreted as a text node, a DOM node, which is interpreted as
// itself, or an array.
//
// An array describes a DOM element. The first element in the array
// should be a string, and is the name of the DOM element. If the
// second element is a non-Array, non-DOM node object, it is
// interpreted as an object providing the DOM element's attributes.
// Any elements after that (including the 2nd if it's not an attribute
// object) are interpreted as children of the DOM elements, and must
// either be valid `DOMOutputSpec` values, or the number zero.
//
// The number zero (pronounced “hole”) is used to indicate the place
// where a ProseMirror node's content should be inserted.

// Object used to to expose relevant values and methods
// to DOM serializer functions.

var DOMSerializer = function () {
  function DOMSerializer(options) {
    _classCallCheck(this, DOMSerializer);

    // : Object The options passed to the serializer.
    this.options = options || {};
    // : DOMDocument The DOM document in which we are working.
    this.doc = this.options.document || window.document;
  }

  _createClass(DOMSerializer, [{
    key: "renderNode",
    value: function renderNode(node, pos, offset) {
      var dom = this.renderStructure(node.type.toDOM(node), node.content, pos + 1);
      if (this.options.onRender) dom = this.options.onRender(node, dom, pos, offset) || dom;
      return dom;
    }
  }, {
    key: "renderStructure",
    value: function renderStructure(structure, content, startPos) {
      if (typeof structure == "string") return this.doc.createTextNode(structure);
      if (structure.nodeType != null) return structure;
      var dom = this.doc.createElement(structure[0]),
          attrs = structure[1],
          start = 1;
      if (attrs && (typeof attrs === "undefined" ? "undefined" : _typeof(attrs)) == "object" && attrs.nodeType == null && !Array.isArray(attrs)) {
        start = 2;
        for (var name in attrs) {
          if (name == "style") dom.style.cssText = attrs[name];else if (attrs[name]) dom.setAttribute(name, attrs[name]);
        }
      }
      for (var i = start; i < structure.length; i++) {
        var child = structure[i];
        if (child === 0) {
          if (!content) throw new RangeError("Content hole not allowed in a Mark spec (must produce a single node)");
          if (i < structure.length - 1 || i > start) throw new RangeError("Content hole must be the only child of its parent node");
          if (this.options.onContainer) this.options.onContainer(dom);
          this.renderFragment(content, dom, startPos);
        } else {
          dom.appendChild(this.renderStructure(child, content, startPos));
        }
      }
      return dom;
    }
  }, {
    key: "renderFragment",
    value: function renderFragment(fragment, where, startPos) {
      if (!where) where = this.doc.createDocumentFragment();
      if (fragment.size == 0) return where;

      if (!fragment.firstChild.isInline) this.renderBlocksInto(fragment, where, startPos);else if (this.options.renderInlineFlat) this.renderInlineFlatInto(fragment, where, startPos);else this.renderInlineInto(fragment, where, startPos);
      return where;
    }
  }, {
    key: "renderBlocksInto",
    value: function renderBlocksInto(fragment, where, startPos) {
      var _this = this;

      fragment.forEach(function (node, offset) {
        return where.appendChild(_this.renderNode(node, startPos + offset, offset));
      });
    }
  }, {
    key: "renderInlineInto",
    value: function renderInlineInto(fragment, where, startPos) {
      var _this2 = this;

      var top = where;
      var active = [];
      fragment.forEach(function (node, offset) {
        var keep = 0;
        for (; keep < Math.min(active.length, node.marks.length); ++keep) {
          if (!node.marks[keep].eq(active[keep])) break;
        }while (keep < active.length) {
          active.pop();
          top = top.parentNode;
        }
        while (active.length < node.marks.length) {
          var add = node.marks[active.length];
          active.push(add);
          top = top.appendChild(_this2.renderMark(add));
        }
        top.appendChild(_this2.renderNode(node, startPos + offset, offset));
      });
    }
  }, {
    key: "renderInlineFlatInto",
    value: function renderInlineFlatInto(fragment, where, startPos) {
      var _this3 = this;

      fragment.forEach(function (node, offset) {
        var pos = startPos + offset,
            dom = _this3.renderNode(node, pos, offset);
        dom = _this3.wrapInlineFlat(dom, node.marks);
        dom = _this3.options.renderInlineFlat(node, dom, pos, offset) || dom;
        where.appendChild(dom);
      });
    }
  }, {
    key: "renderMark",
    value: function renderMark(mark) {
      return this.renderStructure(mark.type.toDOM(mark));
    }
  }, {
    key: "wrapInlineFlat",
    value: function wrapInlineFlat(dom, marks) {
      for (var i = marks.length - 1; i >= 0; i--) {
        var wrap = this.renderMark(marks[i]);
        wrap.appendChild(dom);
        dom = wrap;
      }
      return dom;
    }
  }]);

  return DOMSerializer;
}();

function fragmentToDOM(fragment, options) {
  return new DOMSerializer(options).renderFragment(fragment, null, options.pos || 0);
}
exports.fragmentToDOM = fragmentToDOM;

function nodeToDOM(node, options) {
  var serializer = new DOMSerializer(options),
      pos = options.pos || 0;
  var dom = serializer.renderNode(node, pos, options.offset || 0);
  if (node.isInline) {
    dom = serializer.wrapInlineFlat(dom, node.marks);
    if (serializer.options.renderInlineFlat) dom = options.renderInlineFlat(node, dom, pos, options.offset || 0) || dom;
  }
  return dom;
}
exports.nodeToDOM = nodeToDOM;