"use strict";

var _require = require("../schema-basic");

var StrongMark = _require.StrongMark;
var EmMark = _require.EmMark;
var CodeMark = _require.CodeMark;
var LinkMark = _require.LinkMark;
var Image = _require.Image;
var BulletList = _require.BulletList;
var OrderedList = _require.OrderedList;
var BlockQuote = _require.BlockQuote;
var Heading = _require.Heading;
var Paragraph = _require.Paragraph;
var CodeBlock = _require.CodeBlock;
var HorizontalRule = _require.HorizontalRule;

var _require2 = require("../menu");

var toggleMarkItem = _require2.toggleMarkItem;
var insertItem = _require2.insertItem;
var wrapItem = _require2.wrapItem;
var blockTypeItem = _require2.blockTypeItem;
var Dropdown = _require2.Dropdown;
var DropdownSubmenu = _require2.DropdownSubmenu;
var joinUpItem = _require2.joinUpItem;
var liftItem = _require2.liftItem;
var selectParentNodeItem = _require2.selectParentNodeItem;
var undoItem = _require2.undoItem;
var redoItem = _require2.redoItem;
var wrapListItem = _require2.wrapListItem;
var icons = _require2.icons;
var MenuItem = _require2.MenuItem;

var _require3 = require("../schema-table");

var Table = _require3.Table;
var TableRow = _require3.TableRow;
var createTable = _require3.createTable;
var addColumnBefore = _require3.addColumnBefore;
var addColumnAfter = _require3.addColumnAfter;
var removeColumn = _require3.removeColumn;
var addRowBefore = _require3.addRowBefore;
var addRowAfter = _require3.addRowAfter;
var removeRow = _require3.removeRow;

var _require4 = require("../ui");

var FieldPrompt = _require4.FieldPrompt;
var TextField = _require4.TextField;

// Helpers to create specific types of items

// : (ProseMirror, (attrs: ?Object))
// A function that will prompt for the attributes of a [link
// mark](#LinkMark) (using `FieldPrompt`), and call a callback with
// the result.

function promptLinkAttrs(pm, callback) {
  new FieldPrompt(pm, "Create a link", {
    href: new TextField({
      label: "Link target",
      required: true,
      clean: function clean(val) {
        if (!/^https?:\/\//i.test(val)) val = 'http://' + val;
        return val;
      }
    }),
    title: new TextField({ label: "Title" })
  }).open(callback);
}

// : (ProseMirror, (attrs: ?Object))
// A function that will prompt for the attributes of an [image
// node](#Image) (using `FieldPrompt`), and call a callback with the
// result.
function promptImageAttrs(pm, callback, nodeType) {
  var _pm$selection = pm.selection;
  var node = _pm$selection.node;
  var from = _pm$selection.from;
  var to = _pm$selection.to;var attrs = nodeType && node && node.type == nodeType && node.attrs;
  new FieldPrompt(pm, "Insert image", {
    src: new TextField({ label: "Location", required: true, value: attrs && attrs.src }),
    title: new TextField({ label: "Title", value: attrs && attrs.title }),
    alt: new TextField({ label: "Description",
      value: attrs ? attrs.title : pm.doc.textBetween(from, to, " ") })
  }).open(callback);
}

function positiveInteger(value) {
  if (!/^[1-9]\d*$/.test(value)) return "Should be a positive integer";
}

function promptTableSize(pm, callback) {
  new FieldPrompt(pm, "Insert table", {
    rows: new TextField({ label: "Rows", validate: positiveInteger }),
    cols: new TextField({ label: "Columns", validate: positiveInteger })
  }).open(callback);
}

function insertTableItem(tableType) {
  return new MenuItem({
    title: "Insert a table",
    run: function run(pm) {
      promptTableSize(pm, function (_ref) {
        var rows = _ref.rows;
        var cols = _ref.cols;

        pm.tr.replaceSelection(createTable(tableType, +rows, +cols)).applyAndScroll();
      });
    },
    select: function select(pm) {
      var $from = pm.selection.$from;
      for (var d = $from.depth; d >= 0; d--) {
        var index = $from.index(d);
        if ($from.node(d).canReplaceWith(index, index, tableType)) return true;
      }
      return false;
    },

    label: "Table"
  });
}

function simpleItem(label, cmd) {
  return new MenuItem({
    title: label,
    label: label,
    run: cmd,
    select: function select(pm) {
      return cmd(pm, false);
    }
  });
}

// :: (Schema) → Object
// Given a schema, look for default mark and node types in it and
// return an object with relevant menu items relating to those marks:
//
// **`toggleStrong`**`: MenuItem`
//   : A menu item to toggle the [strong mark](#StrongMark).
//
// **`toggleEm`**`: MenuItem`
//   : A menu item to toggle the [emphasis mark](#EmMark).
//
// **`toggleCode`**`: MenuItem`
//   : A menu item to toggle the [code font mark](#CodeMark).
//
// **`toggleLink`**`: MenuItem`
//   : A menu item to toggle the [link mark](#LinkMark).
//
// **`insertImage`**`: MenuItem`
//   : A menu item to insert an [image](#Image).
//
// **`wrapBulletList`**`: MenuItem`
//   : A menu item to wrap the selection in a [bullet list](#BulletList).
//
// **`wrapOrderedList`**`: MenuItem`
//   : A menu item to wrap the selection in an [ordered list](#OrderedList).
//
// **`wrapBlockQuote`**`: MenuItem`
//   : A menu item to wrap the selection in a [block quote](#BlockQuote).
//
// **`makeParagraph`**`: MenuItem`
//   : A menu item to set the current textblock to be a normal
//     [paragraph](#Paragraph).
//
// **`makeCodeBlock`**`: MenuItem`
//   : A menu item to set the current textblock to be a
//     [code block](#CodeBlock).
//
// **`insertTable`**`: MenuItem`
//   : An item to insert a [table](#schema-table).
//
// **`addRowBefore`**, **`addRowAfter`**, **`removeRow`**, **`addColumnBefore`**, **`addColumnAfter`**, **`removeColumn`**`: MenuItem`
//   : Table-manipulation items.
//
// **`makeHead[N]`**`: MenuItem`
//   : Where _N_ is 1 to 6. Menu items to set the current textblock to
//     be a [heading](#Heading) of level _N_.
//
// **`insertHorizontalRule`**`: MenuItem`
//   : A menu item to insert a horizontal rule.
//
// The return value also contains some prefabricated menu elements and
// menus, that you can use instead of composing your own menu from
// scratch:
//
// **`insertMenu`**`: Dropdown`
//   : A dropdown containing the `insertImage` and
//     `insertHorizontalRule` items.
//
// **`typeMenu`**`: Dropdown`
//   : A dropdown containing the items for making the current
//     textblock a paragraph, code block, or heading.
//
// **`inlineMenu`**`: [[MenuElement]]`
//   : An array of arrays of menu elements for use as the inline menu
//     to, for example, a [tooltip menu](#menu/tooltipmenu).
//
// **`blockMenu`**`: [[MenuElement]]`
//   : An array of arrays of menu elements for use as the block menu
//     to, for example, a [tooltip menu](#menu/tooltipmenu).
//
// **`fullMenu`**`: [[MenuElement]]`
//   : An array of arrays of menu elements for use as the full menu
//     for, for example the [menu bar](#menuBar).
function buildMenuItems(schema) {
  var r = {};
  for (var name in schema.marks) {
    var mark = schema.marks[name];
    if (mark instanceof StrongMark) r.toggleStrong = toggleMarkItem(mark, { title: "Toggle strong style", icon: icons.strong });
    if (mark instanceof EmMark) r.toggleEm = toggleMarkItem(mark, { title: "Toggle emphasis", icon: icons.em });
    if (mark instanceof CodeMark) r.toggleCode = toggleMarkItem(mark, { title: "Toggle code font", icon: icons.code });
    if (mark instanceof LinkMark) r.toggleLink = toggleMarkItem(mark, { title: "Add or remove link", icon: icons.link, attrs: promptLinkAttrs });
  }

  var _loop = function _loop(_name) {
    var node = schema.nodes[_name];
    if (node instanceof Image) r.insertImage = insertItem(node, {
      title: "Insert image",
      label: "Image",
      attrs: function attrs(pm, c) {
        return promptImageAttrs(pm, c, node);
      }
    });
    if (node instanceof BulletList) r.wrapBulletList = wrapListItem(node, {
      title: "Wrap in bullet list",
      icon: icons.bulletList
    });
    if (node instanceof OrderedList) r.wrapOrderedList = wrapListItem(node, {
      title: "Wrap in ordered list",
      icon: icons.orderedList
    });
    if (node instanceof BlockQuote) r.wrapBlockQuote = wrapItem(node, {
      title: "Wrap in block quote",
      icon: icons.blockquote
    });
    if (node instanceof Paragraph) r.makeParagraph = blockTypeItem(node, {
      title: "Change to paragraph",
      label: "Plain"
    });
    if (node instanceof CodeBlock) r.makeCodeBlock = blockTypeItem(node, {
      title: "Change to code block",
      label: "Code"
    });
    if (node instanceof Heading) for (var i = 1; i <= 10; i++) {
      r["makeHead" + i] = blockTypeItem(node, {
        title: "Change to heading " + i,
        label: "Level " + i,
        attrs: { level: i }
      });
    }if (node instanceof HorizontalRule) r.insertHorizontalRule = insertItem(node, {
      title: "Insert horizontal rule",
      label: "Horizontal rule"
    });
    if (node instanceof Table) r.insertTable = insertTableItem(node);
    if (node instanceof TableRow) {
      r.addRowBefore = simpleItem("Add row before", addRowBefore);
      r.addRowAfter = simpleItem("Add row after", addRowAfter);
      r.removeRow = simpleItem("Remove row", removeRow);
      r.addColumnBefore = simpleItem("Add column before", addColumnBefore);
      r.addColumnAfter = simpleItem("Add column after", addColumnAfter);
      r.removeColumn = simpleItem("Remove column", removeColumn);
    }
  };

  for (var _name in schema.nodes) {
    _loop(_name);
  }

  var cut = function cut(arr) {
    return arr.filter(function (x) {
      return x;
    });
  };
  r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule, r.insertTable]), { label: "Insert" });
  r.typeMenu = new Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new DropdownSubmenu(cut([r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6]), { label: "Heading" })]), { label: "Type..." });
  var tableItems = cut([r.addRowBefore, r.addRowAfter, r.removeRow, r.addColumnBefore, r.addColumnAfter, r.removeColumn]);
  if (tableItems.length) r.tableMenu = new Dropdown(tableItems, { label: "Table" });

  r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink]), [r.insertMenu]];
  r.blockMenu = [cut([r.typeMenu, r.tableMenu, r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem, liftItem, selectParentNodeItem])];
  r.fullMenu = r.inlineMenu.concat(r.blockMenu).concat([[undoItem, redoItem]]);

  return r;
}
exports.buildMenuItems = buildMenuItems;