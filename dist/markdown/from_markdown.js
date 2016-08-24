"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var markdownit = require("markdown-it");

var _require = require("../schema-basic");

var schema = _require.schema;

var _require2 = require("../model");

var Mark = _require2.Mark;


function maybeMerge(a, b) {
  if (a.isText && b.isText && Mark.sameSet(a.marks, b.marks)) return a.copy(a.text + b.text);
}

// Object used to track the context of a running parse.

var MarkdownParseState = function () {
  function MarkdownParseState(schema, tokenHandlers) {
    _classCallCheck(this, MarkdownParseState);

    this.schema = schema;
    this.stack = [{ type: schema.nodes.doc, content: [] }];
    this.marks = Mark.none;
    this.tokenHandlers = tokenHandlers;
  }

  _createClass(MarkdownParseState, [{
    key: "top",
    value: function top() {
      return this.stack[this.stack.length - 1];
    }
  }, {
    key: "push",
    value: function push(elt) {
      if (this.stack.length) this.top().content.push(elt);
    }

    // : (string)
    // Adds the given text to the current position in the document,
    // using the current marks as styling.

  }, {
    key: "addText",
    value: function addText(text) {
      if (!text) return;
      var nodes = this.top().content,
          last = nodes[nodes.length - 1];
      var node = this.schema.text(text, this.marks),
          merged = void 0;
      if (last && (merged = maybeMerge(last, node))) nodes[nodes.length - 1] = merged;else nodes.push(node);
    }

    // : (Mark)
    // Adds the given mark to the set of active marks.

  }, {
    key: "openMark",
    value: function openMark(mark) {
      this.marks = mark.addToSet(this.marks);
    }

    // : (Mark)
    // Removes the given mark from the set of active marks.

  }, {
    key: "closeMark",
    value: function closeMark(mark) {
      this.marks = mark.removeFromSet(this.marks);
    }
  }, {
    key: "parseTokens",
    value: function parseTokens(toks) {
      for (var i = 0; i < toks.length; i++) {
        var tok = toks[i];
        var handler = this.tokenHandlers[tok.type];
        if (!handler) throw new Error("Token type `" + tok.type + "` not supported by Markdown parser");
        handler(this, tok);
      }
    }

    // : (NodeType, ?Object, ?[Node]) → ?Node
    // Add a node at the current position.

  }, {
    key: "addNode",
    value: function addNode(type, attrs, content) {
      var node = type.createAndFill(attrs, content, this.marks);
      if (!node) return null;
      this.push(node);
      return node;
    }

    // : (NodeType, ?Object)
    // Wrap subsequent content in a node of the given type.

  }, {
    key: "openNode",
    value: function openNode(type, attrs) {
      this.stack.push({ type: type, attrs: attrs, content: [] });
    }

    // : () → ?Node
    // Close and return the node that is currently on top of the stack.

  }, {
    key: "closeNode",
    value: function closeNode() {
      if (this.marks.length) this.marks = Mark.none;
      var info = this.stack.pop();
      return this.addNode(info.type, info.attrs, info.content);
    }
  }]);

  return MarkdownParseState;
}();

function attrs(given, token) {
  return given instanceof Function ? given(token) : given;
}

function tokenHandlers(schema, tokens) {
  var handlers = Object.create(null);

  var _loop = function _loop(type) {
    var spec = tokens[type];
    if (spec.block) {
      (function () {
        var nodeType = schema.nodeType(spec.block);
        handlers[type + "_open"] = function (state, tok) {
          return state.openNode(nodeType, attrs(spec.attrs, tok));
        };
        handlers[type + "_close"] = function (state) {
          return state.closeNode();
        };
      })();
    } else if (spec.node) {
      (function () {
        var nodeType = schema.nodeType(spec.node);
        handlers[type] = function (state, tok) {
          return state.addNode(nodeType, attrs(spec.attrs, tok));
        };
      })();
    } else if (spec.mark) {
      (function () {
        var markType = schema.marks[spec.mark];
        if (type == "code_inline") {
          // code_inline tokens are strange
          handlers[type] = function (state, tok) {
            state.openMark(markType.create(attrs(spec.attrs, tok)));
            state.addText(tok.content);
            state.closeMark(markType);
          };
        } else {
          handlers[type + "_open"] = function (state, tok) {
            return state.openMark(markType.create(attrs(spec.attrs, tok)));
          };
          handlers[type + "_close"] = function (state) {
            return state.closeMark(markType);
          };
        }
      })();
    } else {
      throw new RangeError("Unrecognized parsing spec " + JSON.stringify(spec));
    }
  };

  for (var type in tokens) {
    _loop(type);
  }

  handlers.text = function (state, tok) {
    return state.addText(tok.content);
  };
  handlers.inline = function (state, tok) {
    return state.parseTokens(tok.children);
  };
  handlers.softbreak = function (state) {
    return state.addText("\n");
  };

  return handlers;
}

// ;; A configuration of a Markdown parser. Such a parser uses
// [markdown-it](https://github.com/markdown-it/markdown-it) to
// tokenize a file, and then runs the custom rules it is given over
// the tokens to create a ProseMirror document tree.

var MarkdownParser = function () {
  // :: (Schema, MarkdownIt, Object)
  // Create a parser with the given configuration. You can configure
  // the markdown-it parser to parse the dialect you want, and provide
  // a description of the ProseMirror entities those tokens map to in
  // the `tokens` object, which maps token names to descriptions of
  // what to do with them. Such a description is an object, and may
  // have the following properties:
  //
  // **`node`**`: ?string`
  //   : This token maps to a single node, whose type can be looked up
  //     in the schema under the given name. Exactly one of `node`,
  //     `block`, or `mark` must be set.
  //
  // **`block`**`: ?string`
  //   : This token comes in `_open` and `_close` variants (which are
  //     appended to the base token name provides a the object
  //     property), and wraps a block of content. The block should be
  //     wrapped in a node of the type named to by the property's
  //     value.
  //
  // **`mark`**`: ?string`
  //   : This token also comes in `_open` and `_close` variants, but
  //     should add a mark (named by the value) to its content, rather
  //     than wrapping it in a node.
  //
  // **`attrs`**`: ?union<Object, (MarkdownToken) → Object>`
  //   : If the mark or node to be created needs attributes, they can
  //     be either given directly, or as a function that takes a
  //     [markdown-it
  //     token](https://markdown-it.github.io/markdown-it/#Token) and
  //     returns an attribute object.

  function MarkdownParser(schema, tokenizer, tokens) {
    _classCallCheck(this, MarkdownParser);

    // :: Object The value of the `tokens` object used to construct
    // this parser. Can be useful to copy and modify to base other
    // parsers on.
    this.tokens = tokens;
    this.schema = schema;
    this.tokenizer = tokenizer;
    this.tokenHandlers = tokenHandlers(schema, tokens);
  }

  // :: (string) → Node
  // Parse a string as [CommonMark](http://commonmark.org/) markup,
  // and create a ProseMirror document as prescribed by this parser's
  // rules.


  _createClass(MarkdownParser, [{
    key: "parse",
    value: function parse(text) {
      var state = new MarkdownParseState(this.schema, this.tokenHandlers),
          doc = void 0;
      state.parseTokens(this.tokenizer.parse(text, {}));
      do {
        doc = state.closeNode();
      } while (state.stack.length);
      return doc;
    }
  }]);

  return MarkdownParser;
}();

exports.MarkdownParser = MarkdownParser;

// :: MarkdownParser
// A parser parsing unextended [CommonMark](http://commonmark.org/),
// without inline HTML, and producing a document in the basic schema.
var defaultMarkdownParser = new MarkdownParser(schema, markdownit("commonmark", { html: false }), {
  blockquote: { block: "blockquote" },
  paragraph: { block: "paragraph" },
  list_item: { block: "list_item" },
  bullet_list: { block: "bullet_list" },
  ordered_list: { block: "ordered_list", attrs: function attrs(tok) {
      return { order: +tok.attrGet("order") || 1 };
    } },
  heading: { block: "heading", attrs: function attrs(tok) {
      return { level: +tok.tag.slice(1) };
    } },
  code_block: { block: "code_block" },
  fence: { block: "code_block" },
  hr: { node: "horizontal_rule" },
  image: { node: "image", attrs: function attrs(tok) {
      return {
        src: tok.attrGet("src"),
        title: tok.attrGet("title") || null,
        alt: tok.children[0] && tok.children[0].content || null
      };
    } },
  hardbreak: { node: "hard_break" },

  em: { mark: "em" },
  strong: { mark: "strong" },
  link: { mark: "link", attrs: function attrs(tok) {
      return {
        href: tok.attrGet("href"),
        title: tok.attrGet("title") || null
      };
    } },
  code_inline: { mark: "code" }
});
exports.defaultMarkdownParser = defaultMarkdownParser;