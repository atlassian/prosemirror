"use strict";

var Keymap = require("browserkeymap");

var _require = require("../schema-basic");

var HardBreak = _require.HardBreak;
var BulletList = _require.BulletList;
var OrderedList = _require.OrderedList;
var ListItem = _require.ListItem;
var BlockQuote = _require.BlockQuote;
var HorizontalRule = _require.HorizontalRule;
var Paragraph = _require.Paragraph;
var CodeBlock = _require.CodeBlock;
var Heading = _require.Heading;
var StrongMark = _require.StrongMark;
var EmMark = _require.EmMark;
var CodeMark = _require.CodeMark;

var browser = require("../util/browser");

var _require$commands = require("../edit").commands;

var wrapIn = _require$commands.wrapIn;
var setBlockType = _require$commands.setBlockType;
var wrapInList = _require$commands.wrapInList;
var splitListItem = _require$commands.splitListItem;
var liftListItem = _require$commands.liftListItem;
var sinkListItem = _require$commands.sinkListItem;
var chainCommands = _require$commands.chainCommands;
var newlineInCode = _require$commands.newlineInCode;
var toggleMark = _require$commands.toggleMark;

// :: (Schema, ?Object) → Keymap
// Inspect the given schema looking for marks and nodes from the
// basic schema, and if found, add key bindings related to them.
// This will add:
//
// * **Mod-B** for toggling [strong](#StrongMark)
// * **Mod-I** for toggling [emphasis](#EmMark)
// * **Mod-\`** for toggling [code font](#CodeMark)
// * **Ctrl-Shift-0** for making the current textblock a paragraph
// * **Ctrl-Shift-1** to **Ctrl-Shift-6** for making the current
//   textblock a heading of the corresponding level
// * **Ctrl-Shift-\\** to make the current textblock a code block
// * **Ctrl-Shift-8** to wrap the selection in an ordered list
// * **Ctrl-Shift-9** to wrap the selection in a bullet list
// * **Ctrl-Shift-.** to wrap the selection in a block quote
// * **Enter** to split a non-empty textblock in a list item while at
//   the same time splitting the list item
// * **Mod-Enter** to insert a hard break
// * **Mod-Shift-minus** to insert a horizontal rule
//
// You can suppress or map these bindings by passing a `mapKeys`
// argument, which maps key names (say `"Mod-B"` to either `false`, to
// remove the binding, or a new key name string.

function buildKeymap(schema, mapKeys) {
  var keys = {};
  function bind(key, cmd) {
    if (mapKeys) {
      var mapped = mapKeys[key];
      if (mapped === false) return;
      if (mapped) key = mapped;
    }
    keys[key] = cmd;
  }

  for (var name in schema.marks) {
    var mark = schema.marks[name];
    if (mark instanceof StrongMark) bind("Mod-B", toggleMark(mark));
    if (mark instanceof EmMark) bind("Mod-I", toggleMark(mark));
    if (mark instanceof CodeMark) bind("Mod-`", toggleMark(mark));
  }

  var _loop = function _loop(_name) {
    var node = schema.nodes[_name];
    if (node instanceof BulletList) bind("Shift-Ctrl-8", wrapInList(node));
    if (node instanceof OrderedList) bind("Shift-Ctrl-9", wrapInList(node));
    if (node instanceof BlockQuote) bind("Shift-Ctrl-.", wrapIn(node));
    if (node instanceof HardBreak) {
      var cmd = chainCommands(newlineInCode, function (pm) {
        return pm.tr.replaceSelection(node.create()).applyAndScroll();
      });
      bind("Mod-Enter", cmd);
      bind("Shift-Enter", cmd);
      if (browser.mac) bind("Ctrl-Enter", cmd);
    }
    if (node instanceof ListItem) {
      bind("Enter", splitListItem(node));
      bind("Mod-[", liftListItem(node));
      bind("Mod-]", sinkListItem(node));
    }
    if (node instanceof Paragraph) bind("Shift-Ctrl-0", setBlockType(node));
    if (node instanceof CodeBlock) bind("Shift-Ctrl-\\", setBlockType(node));
    if (node instanceof Heading) for (var i = 1; i <= 6; i++) {
      bind("Shift-Ctrl-" + i, setBlockType(node, { level: i }));
    }if (node instanceof HorizontalRule) bind("Mod-Shift--", function (pm) {
      return pm.tr.replaceSelection(node.create()).applyAndScroll();
    });
  };

  for (var _name in schema.nodes) {
    _loop(_name);
  }
  return new Keymap(keys);
}
exports.buildKeymap = buildKeymap;