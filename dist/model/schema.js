"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("./node");

var Node = _require.Node;
var TextNode = _require.TextNode;

var _require2 = require("./fragment");

var Fragment = _require2.Fragment;

var _require3 = require("./mark");

var Mark = _require3.Mark;

var _require4 = require("./content");

var ContentExpr = _require4.ContentExpr;

var _require5 = require("./from_dom");

var _parseDOM = _require5.parseDOM;

var _require6 = require("../util/obj");

var copyObj = _require6.copyObj;

var _require7 = require("../util/orderedmap");

var OrderedMap = _require7.OrderedMap;

// For node types where all attrs have a default value (or which don't
// have any attributes), build up a single reusable default attribute
// object, and use it for all nodes that don't specify specific
// attributes.

function defaultAttrs(attrs) {
  var defaults = Object.create(null);
  for (var attrName in attrs) {
    var attr = attrs[attrName];
    if (attr.default === undefined) return null;
    defaults[attrName] = attr.default;
  }
  return defaults;
}

function _computeAttrs(attrs, value) {
  var built = Object.create(null);
  for (var name in attrs) {
    var given = value && value[name];
    if (given == null) {
      var attr = attrs[name];
      if (attr.default !== undefined) given = attr.default;else if (attr.compute) given = attr.compute();else throw new RangeError("No value supplied for attribute " + name);
    }
    built[name] = given;
  }
  return built;
}

// ;; Node types are objects allocated once per `Schema`
// and used to tag `Node` instances with a type. They are
// instances of sub-types of this class, and contain information about
// the node type (its name, its allowed attributes, methods for
// serializing it to various formats, information to guide
// deserialization, and so on).

var NodeType = function () {
  function NodeType(name, schema) {
    _classCallCheck(this, NodeType);

    // :: string
    // The name the node type has in this schema.
    this.name = name;
    // Freeze the attributes, to avoid calling a potentially expensive
    // getter all the time.
    Object.defineProperty(this, "attrs", { value: copyObj(this.attrs) });
    this.defaultAttrs = defaultAttrs(this.attrs);
    this.contentExpr = null;
    // :: Schema
    // A link back to the `Schema` the node type belongs to.
    this.schema = schema;
  }

  // :: Object<Attribute> #path=NodeType.prototype.attrs
  // The attributes for this node type.

  // :: bool
  // True if this is a block type.


  _createClass(NodeType, [{
    key: "hasRequiredAttrs",
    value: function hasRequiredAttrs(ignore) {
      for (var n in this.attrs) {
        if (this.attrs[n].isRequired && (!ignore || !(n in ignore))) return true;
      }return false;
    }
  }, {
    key: "compatibleContent",
    value: function compatibleContent(other) {
      return this == other || this.contentExpr.compatible(other.contentExpr);
    }
  }, {
    key: "computeAttrs",
    value: function computeAttrs(attrs) {
      if (!attrs && this.defaultAttrs) return this.defaultAttrs;else return _computeAttrs(this.attrs, attrs);
    }

    // :: (?Object, ?union<Fragment, Node, [Node]>, ?[Mark]) → Node
    // Create a `Node` of this type. The given attributes are
    // checked and defaulted (you can pass `null` to use the type's
    // defaults entirely, if no required attributes exist). `content`
    // may be a `Fragment`, a node, an array of nodes, or
    // `null`. Similarly `marks` may be `null` to default to the empty
    // set of marks.

  }, {
    key: "create",
    value: function create(attrs, content, marks) {
      return new Node(this, this.computeAttrs(attrs), Fragment.from(content), Mark.setFrom(marks));
    }

    // :: (?Object, ?union<Fragment, Node, [Node]>, ?[Mark]) → Node
    // Like [`create`](NodeType.create), but check the given content
    // against the node type's content restrictions, and throw an error
    // if it doesn't match.

  }, {
    key: "createChecked",
    value: function createChecked(attrs, content, marks) {
      attrs = this.computeAttrs(attrs);
      content = Fragment.from(content);
      if (!this.validContent(content, attrs)) throw new RangeError("Invalid content for node " + this.name);
      return new Node(this, attrs, content, Mark.setFrom(marks));
    }

    // :: (?Object, ?union<Fragment, Node, [Node]>, ?[Mark]) → ?Node
    // Like [`create`](NodeType.create), but see if it is necessary to
    // add nodes to the start or end of the given fragment to make it
    // fit the node. If no fitting wrapping can be found, return null.
    // Note that, due to the fact that required nodes can always be
    // created, this will always succeed if you pass null or
    // `Fragment.empty` as content.

  }, {
    key: "createAndFill",
    value: function createAndFill(attrs, content, marks) {
      attrs = this.computeAttrs(attrs);
      content = Fragment.from(content);
      if (content.size) {
        var before = this.contentExpr.start(attrs).fillBefore(content);
        if (!before) return null;
        content = before.append(content);
      }
      var after = this.contentExpr.getMatchAt(attrs, content).fillBefore(Fragment.empty, true);
      if (!after) return null;
      return new Node(this, attrs, content.append(after), Mark.setFrom(marks));
    }

    // :: (Fragment, ?Object) → bool
    // Returns true if the given fragment is valid content for this node
    // type with the given attributes.

  }, {
    key: "validContent",
    value: function validContent(content, attrs) {
      return this.contentExpr.matches(attrs, content);
    }
  }, {
    key: "toDOM",


    // :: (Node) → DOMOutputSpec
    // Defines the way a node of this type should be serialized to
    // DOM/HTML. Should return an [array structure](#DOMOutputSpec) that
    // describes the resulting DOM structure, with an optional number
    // zero (“hole”) in it to indicate where the node's content should
    // be inserted.
    value: function toDOM(_) {
      throw new Error("Failed to override NodeType.toDOM");
    }

    // :: Object<union<ParseSpec, (DOMNode) → union<bool, ParseSpec>>>
    // Defines the way nodes of this type are parsed. Should, if
    // present, contain an object mapping CSS selectors (such as `"p"`
    // for `<p>` tags, or `"div[data-type=foo]"` for `<div>` tags with a
    // specific attribute) to [parse specs](#ParseSpec) or functions
    // that, when given a DOM node, return either `false` or a parse
    // spec.

  }, {
    key: "isBlock",
    get: function get() {
      return false;
    }

    // :: bool
    // True if this is a textblock type, a block that contains inline
    // content.

  }, {
    key: "isTextblock",
    get: function get() {
      return false;
    }

    // :: bool
    // True if this is an inline type.

  }, {
    key: "isInline",
    get: function get() {
      return false;
    }

    // :: bool
    // True if this is the text node type.

  }, {
    key: "isText",
    get: function get() {
      return false;
    }

    // :: bool
    // True for node types that allow no content.

  }, {
    key: "isLeaf",
    get: function get() {
      return this.contentExpr.isLeaf;
    }

    // :: bool
    // Controls whether nodes of this type can be selected (as a [node
    // selection](#NodeSelection)).

  }, {
    key: "selectable",
    get: function get() {
      return true;
    }

    // :: bool
    // Determines whether nodes of this type can be dragged. Enabling it
    // causes ProseMirror to set a `draggable` attribute on its DOM
    // representation, and to put its HTML serialization into the drag
    // event's [data
    // transfer](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer)
    // when dragged.

  }, {
    key: "draggable",
    get: function get() {
      return false;
    }
  }, {
    key: "matchDOMTag",
    get: function get() {}
  }], [{
    key: "compile",
    value: function compile(nodes, schema) {
      var result = Object.create(null);
      nodes.forEach(function (name, spec) {
        return result[name] = new spec.type(name, schema);
      });

      if (!result.doc) throw new RangeError("Every schema needs a 'doc' type");
      if (!result.text) throw new RangeError("Every schema needs a 'text' type");

      return result;
    }
  }]);

  return NodeType;
}();

exports.NodeType = NodeType;

// ;; Base type for block nodetypes.

var Block = function (_NodeType) {
  _inherits(Block, _NodeType);

  function Block() {
    _classCallCheck(this, Block);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Block).apply(this, arguments));
  }

  _createClass(Block, [{
    key: "isBlock",
    get: function get() {
      return true;
    }
  }, {
    key: "isTextblock",
    get: function get() {
      return this.contentExpr.inlineContent;
    }
  }]);

  return Block;
}(NodeType);

exports.Block = Block;

// ;; Base type for inline node types.

var Inline = function (_NodeType2) {
  _inherits(Inline, _NodeType2);

  function Inline() {
    _classCallCheck(this, Inline);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Inline).apply(this, arguments));
  }

  _createClass(Inline, [{
    key: "isInline",
    get: function get() {
      return true;
    }
  }]);

  return Inline;
}(NodeType);

exports.Inline = Inline;

// ;; The text node type.

var Text = function (_Inline) {
  _inherits(Text, _Inline);

  function Text() {
    _classCallCheck(this, Text);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Text).apply(this, arguments));
  }

  _createClass(Text, [{
    key: "create",
    value: function create(attrs, content, marks) {
      return new TextNode(this, this.computeAttrs(attrs), content, marks);
    }
  }, {
    key: "toDOM",
    value: function toDOM(node) {
      return node.text;
    }
  }, {
    key: "selectable",
    get: function get() {
      return false;
    }
  }, {
    key: "isText",
    get: function get() {
      return true;
    }
  }]);

  return Text;
}(Inline);

exports.Text = Text;

// Attribute descriptors

// ;; Attributes are named values associated with nodes and marks.
// Each node type or mark type has a fixed set of attributes, which
// instances of this class are used to control. Attribute values must
// be JSON-serializable.

var Attribute = function () {
  // :: (Object)
  // Create an attribute. `options` is an object containing the
  // settings for the attributes. The following settings are
  // supported:
  //
  // **`default`**`: ?any`
  //   : The default value for this attribute, to choose when no
  //     explicit value is provided.
  //
  // **`compute`**`: ?() → any`
  //   : A function that computes a default value for the attribute.
  //
  // Attributes that have no default or compute property must be
  // provided whenever a node or mark of a type that has them is
  // created.
  function Attribute() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Attribute);

    this.default = options.default;
    this.compute = options.compute;
  }

  _createClass(Attribute, [{
    key: "isRequired",
    get: function get() {
      return this.default === undefined && !this.compute;
    }
  }]);

  return Attribute;
}();

exports.Attribute = Attribute;

// Marks

// ;; Like nodes, marks (which are associated with nodes to signify
// things like emphasis or being part of a link) are tagged with type
// objects, which are instantiated once per `Schema`.

var MarkType = function () {
  function MarkType(name, rank, schema) {
    _classCallCheck(this, MarkType);

    // :: string
    // The name of the mark type.
    this.name = name;
    Object.defineProperty(this, "attrs", { value: copyObj(this.attrs) });
    this.rank = rank;
    // :: Schema
    // The schema that this mark type instance is part of.
    this.schema = schema;
    var defaults = defaultAttrs(this.attrs);
    this.instance = defaults && new Mark(this, defaults);
  }

  // :: bool
  // Whether this mark should be active when the cursor is positioned
  // at the end of the mark.


  _createClass(MarkType, [{
    key: "create",


    // :: (?Object) → Mark
    // Create a mark of this type. `attrs` may be `null` or an object
    // containing only some of the mark's attributes. The others, if
    // they have defaults, will be added.
    value: function create(attrs) {
      if (!attrs && this.instance) return this.instance;
      return new Mark(this, _computeAttrs(this.attrs, attrs));
    }
  }, {
    key: "removeFromSet",


    // :: ([Mark]) → [Mark]
    // When there is a mark of this type in the given set, a new set
    // without it is returned. Otherwise, the input set is returned.
    value: function removeFromSet(set) {
      for (var i = 0; i < set.length; i++) {
        if (set[i].type == this) return set.slice(0, i).concat(set.slice(i + 1));
      }return set;
    }

    // :: ([Mark]) → ?Mark
    // Tests whether there is a mark of this type in the given set.

  }, {
    key: "isInSet",
    value: function isInSet(set) {
      for (var i = 0; i < set.length; i++) {
        if (set[i].type == this) return set[i];
      }
    }

    // :: (mark: Mark) → DOMOutputSpec
    // Defines the way marks of this type should be serialized to DOM/HTML.

  }, {
    key: "toDOM",
    value: function toDOM(_) {
      throw new Error("Failed to override MarkType.toDOM");
    }

    // :: Object<union<ParseSpec, (DOMNode) → union<bool, ParseSpec>>>
    // Defines the way marks of this type are parsed. Works just like
    // `NodeType.matchTag`, but produces marks rather than nodes.

  }, {
    key: "inclusiveRight",
    get: function get() {
      return true;
    }
  }, {
    key: "matchDOMTag",
    get: function get() {}

    // :: Object<union<?Object, (string) → union<bool, ?Object>>>
    // Defines the way DOM styles are mapped to marks of this type. Should
    // contain an object mapping CSS property names, as found in inline
    // styles, to either attributes for this mark (null for default
    // attributes), or a function mapping the style's value to either a
    // set of attributes or `false` to indicate that the style does not
    // match.

  }, {
    key: "matchDOMStyle",
    get: function get() {}
  }], [{
    key: "compile",
    value: function compile(marks, schema) {
      var result = Object.create(null),
          rank = 0;
      marks.forEach(function (name, markType) {
        return result[name] = new markType(name, rank++, schema);
      });
      return result;
    }
  }]);

  return MarkType;
}();

exports.MarkType = MarkType;

// ;; #path=SchemaSpec #kind=interface
// An object describing a schema, as passed to the `Schema`
// constructor.

// :: union<Object<NodeSpec>, OrderedMap<NodeSpec>> #path=SchemaSpec.nodes
// The node types in this schema. Maps names to `NodeSpec` objects
// describing the node to be associated with that name. Their order is significant

// :: ?union<Object<constructor<MarkType>>, OrderedMap<constructor<MarkType>>> #path=SchemaSpec.marks
// The mark types that exist in this schema.

// ;; #path=NodeSpec #kind=interface

// :: constructor<NodeType> #path=NodeSpec.type
// The `NodeType` class to be used for this node.

// :: ?string #path=NodeSpec.content
// The content expression for this node, as described in the [schema
// guide](guide/schema.html). When not given, the node does not allow
// any content.

// :: ?string #path=NodeSpec.group
// The group or space-separated groups to which this node belongs, as
// referred to in the content expressions for the schema.

// ;; Each document is based on a single schema, which provides the
// node and mark types that it is made up of (which, in turn,
// determine the structure it is allowed to have).

var Schema = function () {
  // :: (SchemaSpec, ?any)
  // Construct a schema from a specification.
  function Schema(spec, data) {
    _classCallCheck(this, Schema);

    // :: OrderedMap<NodeSpec> The node specs that the schema is based on.
    this.nodeSpec = OrderedMap.from(spec.nodes);
    // :: OrderedMap<constructor<MarkType>> The mark spec that the schema is based on.
    this.markSpec = OrderedMap.from(spec.marks);

    // :: any A generic field that you can use (by passing a value to
    // the constructor) to store arbitrary data or references in your
    // schema object, for use by node- or mark- methods.
    this.data = data;

    // :: Object<NodeType>
    // An object mapping the schema's node names to node type objects.
    this.nodes = NodeType.compile(this.nodeSpec, this);
    // :: Object<MarkType>
    // A map from mark names to mark type objects.
    this.marks = MarkType.compile(this.markSpec, this);
    for (var prop in this.nodes) {
      if (prop in this.marks) throw new RangeError(prop + " can not be both a node and a mark");
      var type = this.nodes[prop];
      type.contentExpr = ContentExpr.parse(type, this.nodeSpec.get(prop).content || "", this.nodeSpec);
    }

    // :: Object
    // An object for storing whatever values modules may want to
    // compute and cache per schema. (If you want to store something
    // in it, try to use property names unlikely to clash.)
    this.cached = Object.create(null);
    this.cached.wrappings = Object.create(null);

    this.node = this.node.bind(this);
    this.text = this.text.bind(this);
    this.nodeFromJSON = this.nodeFromJSON.bind(this);
    this.markFromJSON = this.markFromJSON.bind(this);
  }

  // :: (union<string, NodeType>, ?Object, ?union<Fragment, Node, [Node]>, ?[Mark]) → Node
  // Create a node in this schema. The `type` may be a string or a
  // `NodeType` instance. Attributes will be extended
  // with defaults, `content` may be a `Fragment`,
  // `null`, a `Node`, or an array of nodes.
  //
  // When creating a text node, `content` should be a string and is
  // interpreted as the node's text.
  //
  // This method is bound to the Schema, meaning you don't have to
  // call it as a method, but can pass it to higher-order functions
  // and such.


  _createClass(Schema, [{
    key: "node",
    value: function node(type, attrs, content, marks) {
      if (typeof type == "string") type = this.nodeType(type);else if (!(type instanceof NodeType)) throw new RangeError("Invalid node type: " + type);else if (type.schema != this) throw new RangeError("Node type from different schema used (" + type.name + ")");

      return type.createChecked(attrs, content, marks);
    }

    // :: (string, ?[Mark]) → Node
    // Create a text node in the schema. This method is bound to the
    // Schema. Empty text nodes are not allowed.

  }, {
    key: "text",
    value: function text(_text, marks) {
      return this.nodes.text.create(null, _text, Mark.setFrom(marks));
    }

    // :: (string, ?Object) → Mark
    // Create a mark with the named type

  }, {
    key: "mark",
    value: function mark(name, attrs) {
      var spec = this.marks[name];
      if (!spec) throw new RangeError("No mark named " + name);
      return spec.create(attrs);
    }

    // :: (Object) → Node
    // Deserialize a node from its JSON representation. This method is
    // bound.

  }, {
    key: "nodeFromJSON",
    value: function nodeFromJSON(json) {
      return Node.fromJSON(this, json);
    }

    // :: (Object) → Mark
    // Deserialize a mark from its JSON representation. This method is
    // bound.

  }, {
    key: "markFromJSON",
    value: function markFromJSON(json) {
      var type = this.marks[json._];
      var attrs = null;
      for (var prop in json) {
        if (prop != "_") {
          if (!attrs) attrs = Object.create(null);
          attrs[prop] = json[prop];
        }
      }return attrs ? type.create(attrs) : type.instance;
    }

    // :: (string) → NodeType
    // Get the `NodeType` associated with the given name in
    // this schema, or raise an error if it does not exist.

  }, {
    key: "nodeType",
    value: function nodeType(name) {
      var found = this.nodes[name];
      if (!found) throw new RangeError("Unknown node type: " + name);
      return found;
    }

    // :: (DOMNode, ?Object) → Node
    // Parse a document from the content of a DOM node. To provide an
    // explicit parent document (for example, when not in a browser
    // window environment, where we simply use the global document),
    // pass it as the `document` property of `options`.

  }, {
    key: "parseDOM",
    value: function parseDOM(dom) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return _parseDOM(this, dom, options);
    }
  }]);

  return Schema;
}();

exports.Schema = Schema;