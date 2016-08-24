"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require("../model");

var Schema = _require.Schema;
var Block = _require.Block;
var Inline = _require.Inline;
var Text = _require.Text;
var Attribute = _require.Attribute;
var MarkType = _require.MarkType;

exports.Text = Text;

// !! This module defines a number of basic node and mark types, and a
// schema that combines them.

// ;; A default top-level document node type.

var Doc = function (_Block) {
  _inherits(Doc, _Block);

  function Doc() {
    _classCallCheck(this, Doc);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Doc).apply(this, arguments));
  }

  return Doc;
}(Block);

exports.Doc = Doc;

// ;; A blockquote node type.

var BlockQuote = function (_Block2) {
  _inherits(BlockQuote, _Block2);

  function BlockQuote() {
    _classCallCheck(this, BlockQuote);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(BlockQuote).apply(this, arguments));
  }

  _createClass(BlockQuote, [{
    key: "toDOM",
    value: function toDOM() {
      return ["blockquote", 0];
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "blockquote": null };
    }
  }]);

  return BlockQuote;
}(Block);

exports.BlockQuote = BlockQuote;

// ;; An ordered list node type. Has a single attribute, `order`,
// which determines the number at which the list starts counting, and
// defaults to 1.

var OrderedList = function (_Block3) {
  _inherits(OrderedList, _Block3);

  function OrderedList() {
    _classCallCheck(this, OrderedList);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(OrderedList).apply(this, arguments));
  }

  _createClass(OrderedList, [{
    key: "toDOM",
    value: function toDOM(node) {
      return ["ol", { start: node.attrs.order == 1 ? null : node.attrs.order }, 0];
    }
  }, {
    key: "attrs",
    get: function get() {
      return { order: new Attribute({ default: 1 }) };
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "ol": function ol(dom) {
          return {
            order: dom.hasAttribute("start") ? +dom.getAttribute("start") : 1
          };
        } };
    }
  }]);

  return OrderedList;
}(Block);

exports.OrderedList = OrderedList;

// ;; A bullet list node type.

var BulletList = function (_Block4) {
  _inherits(BulletList, _Block4);

  function BulletList() {
    _classCallCheck(this, BulletList);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(BulletList).apply(this, arguments));
  }

  _createClass(BulletList, [{
    key: "toDOM",
    value: function toDOM() {
      return ["ul", 0];
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "ul": null };
    }
  }]);

  return BulletList;
}(Block);

exports.BulletList = BulletList;

// ;; A list item node type.

var ListItem = function (_Block5) {
  _inherits(ListItem, _Block5);

  function ListItem() {
    _classCallCheck(this, ListItem);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ListItem).apply(this, arguments));
  }

  _createClass(ListItem, [{
    key: "toDOM",
    value: function toDOM() {
      return ["li", 0];
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "li": null };
    }
  }]);

  return ListItem;
}(Block);

exports.ListItem = ListItem;

// ;; A node type for horizontal rules.

var HorizontalRule = function (_Block6) {
  _inherits(HorizontalRule, _Block6);

  function HorizontalRule() {
    _classCallCheck(this, HorizontalRule);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(HorizontalRule).apply(this, arguments));
  }

  _createClass(HorizontalRule, [{
    key: "toDOM",
    value: function toDOM() {
      return ["div", ["hr"]];
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "hr": null };
    }
  }]);

  return HorizontalRule;
}(Block);

exports.HorizontalRule = HorizontalRule;

// ;; A heading node type. Has a single attribute `level`, which
// indicates the heading level, and defaults to 1.

var Heading = function (_Block7) {
  _inherits(Heading, _Block7);

  function Heading() {
    _classCallCheck(this, Heading);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Heading).apply(this, arguments));
  }

  _createClass(Heading, [{
    key: "toDOM",
    value: function toDOM(node) {
      return ["h" + node.attrs.level, 0];
    }
  }, {
    key: "attrs",
    get: function get() {
      return { level: new Attribute({ default: 1 }) };
    }
    // :: number
    // Controls the maximum heading level. Has the value 6 in the
    // `Heading` class, but you can override it in a subclass.

  }, {
    key: "maxLevel",
    get: function get() {
      return 6;
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return {
        "h1": { level: 1 },
        "h2": { level: 2 },
        "h3": { level: 3 },
        "h4": { level: 4 },
        "h5": { level: 5 },
        "h6": { level: 6 }
      };
    }
  }]);

  return Heading;
}(Block);

exports.Heading = Heading;

// ;; A code block / listing node type.

var CodeBlock = function (_Block8) {
  _inherits(CodeBlock, _Block8);

  function CodeBlock() {
    _classCallCheck(this, CodeBlock);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(CodeBlock).apply(this, arguments));
  }

  _createClass(CodeBlock, [{
    key: "toDOM",
    value: function toDOM() {
      return ["pre", ["code", 0]];
    }
  }, {
    key: "isCode",
    get: function get() {
      return true;
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "pre": [null, { preserveWhitespace: true }] };
    }
  }]);

  return CodeBlock;
}(Block);

exports.CodeBlock = CodeBlock;

// ;; A paragraph node type.

var Paragraph = function (_Block9) {
  _inherits(Paragraph, _Block9);

  function Paragraph() {
    _classCallCheck(this, Paragraph);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Paragraph).apply(this, arguments));
  }

  _createClass(Paragraph, [{
    key: "toDOM",
    value: function toDOM() {
      return ["p", 0];
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "p": null };
    }
  }]);

  return Paragraph;
}(Block);

exports.Paragraph = Paragraph;

// ;; An inline image node type. Has these attributes:
//
// - **`src`** (required): The URL of the image.
// - **`alt`**: The alt text.
// - **`title`**: The title of the image.

var Image = function (_Inline) {
  _inherits(Image, _Inline);

  function Image() {
    _classCallCheck(this, Image);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Image).apply(this, arguments));
  }

  _createClass(Image, [{
    key: "toDOM",
    value: function toDOM(node) {
      return ["img", node.attrs];
    }
  }, {
    key: "attrs",
    get: function get() {
      return {
        src: new Attribute(),
        alt: new Attribute({ default: "" }),
        title: new Attribute({ default: "" })
      };
    }
  }, {
    key: "draggable",
    get: function get() {
      return true;
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "img[src]": function imgSrc(dom) {
          return {
            src: dom.getAttribute("src"),
            title: dom.getAttribute("title"),
            alt: dom.getAttribute("alt")
          };
        } };
    }
  }]);

  return Image;
}(Inline);

exports.Image = Image;

// ;; A hard break node type.

var HardBreak = function (_Inline2) {
  _inherits(HardBreak, _Inline2);

  function HardBreak() {
    _classCallCheck(this, HardBreak);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(HardBreak).apply(this, arguments));
  }

  _createClass(HardBreak, [{
    key: "toDOM",
    value: function toDOM() {
      return ["br"];
    }
  }, {
    key: "selectable",
    get: function get() {
      return false;
    }
  }, {
    key: "isBR",
    get: function get() {
      return true;
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "br": null };
    }
  }]);

  return HardBreak;
}(Inline);

exports.HardBreak = HardBreak;

// ;; An emphasis mark type.

var EmMark = function (_MarkType) {
  _inherits(EmMark, _MarkType);

  function EmMark() {
    _classCallCheck(this, EmMark);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(EmMark).apply(this, arguments));
  }

  _createClass(EmMark, [{
    key: "toDOM",
    value: function toDOM() {
      return ["em"];
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "i": null, "em": null };
    }
  }, {
    key: "matchDOMStyle",
    get: function get() {
      return { "font-style": function fontStyle(value) {
          return value == "italic" && null;
        } };
    }
  }]);

  return EmMark;
}(MarkType);

exports.EmMark = EmMark;

// ;; A strong mark type.

var StrongMark = function (_MarkType2) {
  _inherits(StrongMark, _MarkType2);

  function StrongMark() {
    _classCallCheck(this, StrongMark);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(StrongMark).apply(this, arguments));
  }

  _createClass(StrongMark, [{
    key: "toDOM",
    value: function toDOM() {
      return ["strong"];
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "b": null, "strong": null };
    }
  }, {
    key: "matchDOMStyle",
    get: function get() {
      return { "font-weight": function fontWeight(value) {
          return (/^(bold(er)?|[5-9]\d{2,})$/.test(value) && null
          );
        } };
    }
  }]);

  return StrongMark;
}(MarkType);

exports.StrongMark = StrongMark;

// ;; A link mark type. Has these attributes:
//
// - **`href`** (required): The link target.
// - **`title`**: The link's title.

var LinkMark = function (_MarkType3) {
  _inherits(LinkMark, _MarkType3);

  function LinkMark() {
    _classCallCheck(this, LinkMark);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(LinkMark).apply(this, arguments));
  }

  _createClass(LinkMark, [{
    key: "toDOM",
    value: function toDOM(node) {
      return ["a", node.attrs];
    }
  }, {
    key: "attrs",
    get: function get() {
      return {
        href: new Attribute(),
        title: new Attribute({ default: "" })
      };
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "a[href]": function aHref(dom) {
          return {
            href: dom.getAttribute("href"), title: dom.getAttribute("title")
          };
        } };
    }
  }]);

  return LinkMark;
}(MarkType);

exports.LinkMark = LinkMark;

// ;; A code font mark type.

var CodeMark = function (_MarkType4) {
  _inherits(CodeMark, _MarkType4);

  function CodeMark() {
    _classCallCheck(this, CodeMark);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(CodeMark).apply(this, arguments));
  }

  _createClass(CodeMark, [{
    key: "toDOM",
    value: function toDOM() {
      return ["code"];
    }
  }, {
    key: "isCode",
    get: function get() {
      return true;
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "code": null };
    }
  }]);

  return CodeMark;
}(MarkType);

exports.CodeMark = CodeMark;

// :: Schema
// A basic document schema.
var schema = new Schema({
  nodes: {
    doc: { type: Doc, content: "block+" },

    paragraph: { type: Paragraph, content: "inline<_>*", group: "block" },
    blockquote: { type: BlockQuote, content: "block+", group: "block" },
    ordered_list: { type: OrderedList, content: "list_item+", group: "block" },
    bullet_list: { type: BulletList, content: "list_item+", group: "block" },
    horizontal_rule: { type: HorizontalRule, group: "block" },
    heading: { type: Heading, content: "inline<_>*", group: "block" },
    code_block: { type: CodeBlock, content: "text*", group: "block" },

    list_item: { type: ListItem, content: "paragraph block*" },

    text: { type: Text, group: "inline" },
    image: { type: Image, group: "inline" },
    hard_break: { type: HardBreak, group: "inline" }
  },

  marks: {
    em: EmMark,
    strong: StrongMark,
    link: LinkMark,
    code: CodeMark
  }
});
exports.schema = schema;