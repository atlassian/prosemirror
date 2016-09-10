"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("../inputrules");

var blockQuoteRule = _require.blockQuoteRule;
var orderedListRule = _require.orderedListRule;
var bulletListRule = _require.bulletListRule;
var codeBlockRule = _require.codeBlockRule;
var headingRule = _require.headingRule;
var inputRules = _require.inputRules;
var allInputRules = _require.allInputRules;

var _require2 = require("../schema-basic");

var BlockQuote = _require2.BlockQuote;
var OrderedList = _require2.OrderedList;
var BulletList = _require2.BulletList;
var CodeBlock = _require2.CodeBlock;
var Heading = _require2.Heading;

var _require3 = require("../edit");

var Plugin = _require3.Plugin;

var _require4 = require("../menu");

var menuBar = _require4.menuBar;
var tooltipMenu = _require4.tooltipMenu;

var _require5 = require("./style");

var className = _require5.className;

var _require6 = require("./menu");

var buildMenuItems = _require6.buildMenuItems;

exports.buildMenuItems = buildMenuItems;

var _require7 = require("./keymap");

var buildKeymap = _require7.buildKeymap;

exports.buildKeymap = buildKeymap;

// !! This module exports helper functions for deriving a set of basic
// menu items, input rules, or key bindings from a schema. These
// values need to know about the schema for two reasons—they need
// access to specific instances of node and mark types, and they need
// to know which of the node and mark types that they know about are
// actually present in the schema.
//
// The `exampleSetup` plugin ties these together into a plugin that
// will automatically enable this basic functionality in an editor.

// :: Plugin
// A convenience plugin that bundles together a simple menu with basic
// key bindings, input rules, and styling for the example schema.
// Probably only useful for quickly setting up a passable
// editor—you'll need more control over your settings in most
// real-world situations. The following options are recognized:
//
// **`menuBar`**`: union<bool, Object> = true`
//   : Enable or configure the menu bar. `false` turns it off, `true`
//     enables it with the default options, and passing an object will
//     pass that value on as the options for the menu bar.
//
// **`tooltipMenu`**`: union<bool, Object> = false`
//   : Enable or configure the tooltip menu. Interpreted the same way
//     as `menuBar`.
//
// **`mapKeys`**: ?Object = null`
//   : Can be used to [adjust](#buildKeymap) the key bindings created.
exports.exampleSetup = new Plugin(function () {
  function _class(pm, options) {
    _classCallCheck(this, _class);

    pm.wrapper.classList.add(className);
    this.keymap = buildKeymap(pm.schema, options.mapKeys);
    pm.addKeymap(this.keymap);
    this.inputRules = allInputRules.concat(buildInputRules(pm.schema));
    var rules = inputRules.ensure(pm);
    this.inputRules.forEach(function (rule) {
      return rules.addRule(rule);
    });

    var builtMenu = void 0;
    this.barConf = options.menuBar;
    this.tooltipConf = options.tooltipMenu;

    if (this.barConf === true) {
      builtMenu = buildMenuItems(pm.schema);
      this.barConf = { float: true, content: builtMenu.fullMenu };
    }
    if (this.barConf) menuBar.config(this.barConf).attach(pm);

    if (this.tooltipConf === true) {
      if (!builtMenu) builtMenu = buildMenuItems(pm.schema);
      this.tooltipConf = { selectedBlockMenu: true,
        inlineContent: builtMenu.inlineMenu,
        blockContent: builtMenu.blockMenu };
    }
    if (this.tooltipConf) tooltipMenu.config(this.tooltipConf).attach(pm);
  }

  _createClass(_class, [{
    key: "detach",
    value: function detach(pm) {
      pm.wrapper.classList.remove(className);
      pm.removeKeymap(this.keymap);
      var rules = inputRules.ensure(pm);
      this.inputRules.forEach(function (rule) {
        return rules.removeRule(rule);
      });
      if (this.barConf) menuBar.detach(pm);
      if (this.tooltipConf) tooltipMenu.detach(pm);
    }
  }]);

  return _class;
}(), {
  menuBar: true,
  tooltipMenu: false,
  mapKeys: null
});

// :: (Schema) → [InputRule]
// A set of input rules for creating the basic block quotes, lists,
// code blocks, and heading.
function buildInputRules(schema) {
  var result = [];
  for (var name in schema.nodes) {
    var node = schema.nodes[name];
    if (node instanceof BlockQuote) result.push(blockQuoteRule(node));
    if (node instanceof OrderedList) result.push(orderedListRule(node));
    if (node instanceof BulletList) result.push(bulletListRule(node));
    if (node instanceof CodeBlock) result.push(codeBlockRule(node));
    if (node instanceof Heading) result.push(headingRule(node, 6));
  }
  return result;
}
exports.buildInputRules = buildInputRules;