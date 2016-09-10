"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require("../model");

var Block = _require.Block;
var Attribute = _require.Attribute;
var Fragment = _require.Fragment;
var Slice = _require.Slice;

var _require2 = require("../transform");

var Step = _require2.Step;
var StepResult = _require2.StepResult;
var PosMap = _require2.PosMap;
var ReplaceStep = _require2.ReplaceStep;

var _require3 = require("../util/obj");

var copyObj = _require3.copyObj;

var _require4 = require("../edit");

var Selection = _require4.Selection;

// ;; A table node type. Has one attribute, **`columns`**, which holds
// a number indicating the amount of columns in the table.

var Table = function (_Block) {
  _inherits(Table, _Block);

  function Table() {
    _classCallCheck(this, Table);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Table).apply(this, arguments));
  }

  _createClass(Table, [{
    key: "toDOM",
    value: function toDOM() {
      return ["table", ["tbody", 0]];
    }
  }, {
    key: "attrs",
    get: function get() {
      return { columns: new Attribute({ default: 1 }) };
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "table": function table(dom) {
          var row = dom.querySelector("tr");
          if (!row || !row.children.length) return false;
          // FIXME using the child count as column width is problematic
          // when parsing document fragments
          return { columns: row.children.length };
        } };
    }
  }]);

  return Table;
}(Block);

exports.Table = Table;

// ;; A table row node type. Has one attribute, **`columns`**, which
// holds a number indicating the amount of columns in the table.

var TableRow = function (_Block2) {
  _inherits(TableRow, _Block2);

  function TableRow() {
    _classCallCheck(this, TableRow);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TableRow).apply(this, arguments));
  }

  _createClass(TableRow, [{
    key: "toDOM",
    value: function toDOM() {
      return ["tr", 0];
    }
  }, {
    key: "attrs",
    get: function get() {
      return { columns: new Attribute({ default: 1 }) };
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "tr": function tr(dom) {
          return dom.children.length ? { columns: dom.children.length } : false;
        } };
    }
  }]);

  return TableRow;
}(Block);

exports.TableRow = TableRow;

// ;; A table cell node type.

var TableCell = function (_Block3) {
  _inherits(TableCell, _Block3);

  function TableCell() {
    _classCallCheck(this, TableCell);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TableCell).apply(this, arguments));
  }

  _createClass(TableCell, [{
    key: "toDOM",
    value: function toDOM() {
      return ["td", 0];
    }
  }, {
    key: "matchDOMTag",
    get: function get() {
      return { "td": null };
    }
  }]);

  return TableCell;
}(Block);

exports.TableCell = TableCell;

// :: (OrderedMap, string, ?string) → OrderedMap
// Convenience function for adding table-related node types to a map
// describing the nodes in a schema. Adds `Table` as `"table"`,
// `TableRow` as `"table_row"`, and `TableCell` as `"table_cell"`.
// `cellContent` should be a content expression describing what may
// occur inside cells.
function addTableNodes(nodes, cellContent, tableGroup) {
  return nodes.append({
    table: { type: Table, content: "table_row[columns=.columns]+", group: tableGroup },
    table_row: { type: TableRow, content: "table_cell{.columns}" },
    table_cell: { type: TableCell, content: cellContent }
  });
}
exports.addTableNodes = addTableNodes;

// :: (NodeType, number, number, ?Object) → Node
// Create a table node with the given number of rows and columns.
function createTable(nodeType, rows, columns, attrs) {
  attrs = attrs ? copyObj(attrs) : Object.create(null);
  attrs.columns = columns;
  var rowType = nodeType.contentExpr.elements[0].nodeTypes[0];
  var cellType = rowType.contentExpr.elements[0].nodeTypes[0];
  var cell = cellType.createAndFill(),
      cells = [];
  for (var i = 0; i < columns; i++) {
    cells.push(cell);
  }var row = rowType.create({ columns: columns }, Fragment.from(cells)),
      rowNodes = [];
  for (var _i = 0; _i < rows; _i++) {
    rowNodes.push(row);
  }return nodeType.create(attrs, Fragment.from(rowNodes));
}
exports.createTable = createTable;

// Steps to add and remove a column

function adjustColumns(attrs, diff) {
  var copy = copyObj(attrs);
  copy.columns = attrs.columns + diff;
  return copy;
}

// ;; A `Step` subclass for adding a column to a table in a single
// atomic step.

var AddColumnStep = function (_Step) {
  _inherits(AddColumnStep, _Step);

  function AddColumnStep(positions, cells) {
    _classCallCheck(this, AddColumnStep);

    var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(AddColumnStep).call(this));

    _this4.positions = positions;
    _this4.cells = cells;
    return _this4;
  }

  // :: (Node, number, number, NodeType, ?Object) → AddColumnStep
  // Create a step that inserts a column into the table after
  // `tablePos`, at the index given by `columnIndex`, using cells with
  // the given type and attributes.


  _createClass(AddColumnStep, [{
    key: "apply",
    value: function apply(doc) {
      var index = null,
          table = null,
          tablePos = null;
      for (var i = 0; i < this.positions.length; i++) {
        var $pos = doc.resolve(this.positions[i]);
        if ($pos.depth < 2 || $pos.index(-1) != i) return StepResult.fail("Invalid cell insert position");
        if (table == null) {
          table = $pos.node(-1);
          if (table.childCount != this.positions.length) return StepResult.fail("Mismatch in number of rows");
          tablePos = $pos.before(-1);
          index = $pos.index();
        } else if ($pos.before(-1) != tablePos || $pos.index() != index) {
          return StepResult.fail("Column insert positions not consistent");
        }
      }

      var updatedRows = [];
      for (var _i2 = 0; _i2 < table.childCount; _i2++) {
        var row = table.child(_i2),
            rowCells = index ? [] : [this.cells[_i2]];
        for (var j = 0; j < row.childCount; j++) {
          rowCells.push(row.child(j));
          if (j + 1 == index) rowCells.push(this.cells[_i2]);
        }
        updatedRows.push(row.type.create(adjustColumns(row.attrs, 1), Fragment.from(rowCells)));
      }
      var updatedTable = table.type.create(adjustColumns(table.attrs, 1), Fragment.from(updatedRows));
      return StepResult.fromReplace(doc, tablePos, tablePos + table.nodeSize, new Slice(Fragment.from(updatedTable), 0, 0));
    }
  }, {
    key: "posMap",
    value: function posMap() {
      var ranges = [];
      for (var i = 0; i < this.positions.length; i++) {
        ranges.push(this.positions[i], 0, this.cells[i].nodeSize);
      }return new PosMap(ranges);
    }
  }, {
    key: "invert",
    value: function invert(doc) {
      var $first = doc.resolve(this.positions[0]);
      var table = $first.node(-1);
      var from = [],
          to = [],
          dPos = 0;
      for (var i = 0; i < table.childCount; i++) {
        var pos = this.positions[i] + dPos,
            size = this.cells[i].nodeSize;
        from.push(pos);
        to.push(pos + size);
        dPos += size;
      }
      return new RemoveColumnStep(from, to);
    }
  }, {
    key: "map",
    value: function map(mapping) {
      return new AddColumnStep(this.positions.map(function (p) {
        return mapping.map(p);
      }), this.cells);
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return { stepType: this.jsonID,
        positions: this.positions,
        cells: this.cells.map(function (c) {
          return c.toJSON();
        }) };
    }
  }], [{
    key: "create",
    value: function create(doc, tablePos, columnIndex, cellType, cellAttrs) {
      var cell = cellType.createAndFill(cellAttrs);
      var positions = [],
          cells = [];
      var table = doc.nodeAt(tablePos);
      table.forEach(function (row, rowOff) {
        var cellPos = tablePos + 2 + rowOff;
        for (var i = 0; i < columnIndex; i++) {
          cellPos += row.child(i).nodeSize;
        }positions.push(cellPos);
        cells.push(cell);
      });
      return new AddColumnStep(positions, cells);
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      return new AddColumnStep(json.positions, json.cells.map(schema.nodeFromJSON));
    }
  }]);

  return AddColumnStep;
}(Step);

exports.AddColumnStep = AddColumnStep;

Step.jsonID("addTableColumn", AddColumnStep);

// ;; A subclass of `Step` that removes a column from a table.

var RemoveColumnStep = function (_Step2) {
  _inherits(RemoveColumnStep, _Step2);

  function RemoveColumnStep(from, to) {
    _classCallCheck(this, RemoveColumnStep);

    var _this5 = _possibleConstructorReturn(this, Object.getPrototypeOf(RemoveColumnStep).call(this));

    _this5.from = from;
    _this5.to = to;
    return _this5;
  }

  // :: (Node, number, number) → RemoveColumnStep
  // Create a step that deletes the column at `columnIndex` in the
  // table after `tablePos`.


  _createClass(RemoveColumnStep, [{
    key: "apply",
    value: function apply(doc) {
      var index = null,
          table = null,
          tablePos = null;
      for (var i = 0; i < this.from.length; i++) {
        var $from = doc.resolve(this.from[i]),
            after = $from.nodeAfter;
        if ($from.depth < 2 || $from.index(-1) != i || !after || this.from[i] + after.nodeSize != this.to[i]) return StepResult.fail("Invalid cell delete positions");
        if (table == null) {
          table = $from.node(-1);
          if (table.childCount != this.from.length) return StepResult.fail("Mismatch in number of rows");
          tablePos = $from.before(-1);
          index = $from.index();
        } else if ($from.before(-1) != tablePos || $from.index() != index) {
          return StepResult.fail("Column delete positions not consistent");
        }
      }

      var updatedRows = [];
      for (var _i3 = 0; _i3 < table.childCount; _i3++) {
        var row = table.child(_i3),
            rowCells = [];
        for (var j = 0; j < row.childCount; j++) {
          if (j != index) rowCells.push(row.child(j));
        }updatedRows.push(row.type.create(adjustColumns(row.attrs, -1), Fragment.from(rowCells)));
      }
      var updatedTable = table.type.create(adjustColumns(table.attrs, -1), Fragment.from(updatedRows));
      return StepResult.fromReplace(doc, tablePos, tablePos + table.nodeSize, new Slice(Fragment.from(updatedTable), 0, 0));
    }
  }, {
    key: "posMap",
    value: function posMap() {
      var ranges = [];
      for (var i = 0; i < this.from.length; i++) {
        ranges.push(this.from[i], this.to[i] - this.from[i], 0);
      }return new PosMap(ranges);
    }
  }, {
    key: "invert",
    value: function invert(doc) {
      var $first = doc.resolve(this.from[0]);
      var table = $first.node(-1),
          index = $first.index();
      var positions = [],
          cells = [],
          dPos = 0;
      for (var i = 0; i < table.childCount; i++) {
        positions.push(this.from[i] - dPos);
        var cell = table.child(i).child(index);
        dPos += cell.nodeSize;
        cells.push(cell);
      }
      return new AddColumnStep(positions, cells);
    }
  }, {
    key: "map",
    value: function map(mapping) {
      var from = [],
          to = [];
      for (var i = 0; i < this.from.length; i++) {
        var start = mapping.map(this.from[i], 1),
            end = mapping.map(this.to[i], -1);
        if (end <= start) return null;
        from.push(start);
        to.push(end);
      }
      return new RemoveColumnStep(from, to);
    }
  }], [{
    key: "create",
    value: function create(doc, tablePos, columnIndex) {
      var from = [],
          to = [];
      var table = doc.nodeAt(tablePos);
      table.forEach(function (row, rowOff) {
        var cellPos = tablePos + 2 + rowOff;
        for (var i = 0; i < columnIndex; i++) {
          cellPos += row.child(i).nodeSize;
        }from.push(cellPos);
        to.push(cellPos + row.child(columnIndex).nodeSize);
      });
      return new RemoveColumnStep(from, to);
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(_schema, json) {
      return new RemoveColumnStep(json.from, json.to);
    }
  }]);

  return RemoveColumnStep;
}(Step);

exports.RemoveColumnStep = RemoveColumnStep;

Step.jsonID("removeTableColumn", RemoveColumnStep);

// Table-related command functions

function findRow($pos, pred) {
  for (var d = $pos.depth; d > 0; d--) {
    if ($pos.node(d).type instanceof TableRow && (!pred || pred(d))) return d;
  }return -1;
}

// :: (ProseMirror, ?bool) → bool
// Command function that adds a column before the column with the
// selection.
function addColumnBefore(pm, apply) {
  var $from = pm.selection.$from,
      cellFrom = void 0;
  var rowDepth = findRow($from, function (d) {
    return cellFrom = d == $from.depth ? $from.nodeBefore : $from.node(d + 1);
  });
  if (rowDepth == -1) return false;
  if (apply !== false) pm.tr.step(AddColumnStep.create(pm.doc, $from.before(rowDepth - 1), $from.index(rowDepth), cellFrom.type, cellFrom.attrs)).apply();
  return true;
}
exports.addColumnBefore = addColumnBefore;

// :: (ProseMirror, ?bool) → bool
// Command function that adds a column after the column with the
// selection.
function addColumnAfter(pm, apply) {
  var $from = pm.selection.$from,
      cellFrom = void 0;
  var rowDepth = findRow($from, function (d) {
    return cellFrom = d == $from.depth ? $from.nodeAfter : $from.node(d + 1);
  });
  if (rowDepth == -1) return false;
  if (apply !== false) pm.tr.step(AddColumnStep.create(pm.doc, $from.before(rowDepth - 1), $from.indexAfter(rowDepth) + (rowDepth == $from.depth ? 1 : 0), cellFrom.type, cellFrom.attrs)).apply();
  return true;
}
exports.addColumnAfter = addColumnAfter;

// :: (ProseMirror, ?bool) → bool
// Command function that removes the column with the selection.
function removeColumn(pm, apply) {
  var $from = pm.selection.$from;
  var rowDepth = findRow($from, function (d) {
    return $from.node(d).childCount > 1;
  });
  if (rowDepth == -1) return false;
  if (apply !== false) pm.tr.step(RemoveColumnStep.create(pm.doc, $from.before(rowDepth - 1), $from.index(rowDepth))).apply();
  return true;
}
exports.removeColumn = removeColumn;

function addRow(pm, apply, side) {
  var $from = pm.selection.$from;
  var rowDepth = findRow($from);
  if (rowDepth == -1) return false;
  if (apply !== false) {
    (function () {
      var exampleRow = $from.node(rowDepth);
      var cells = [],
          pos = side < 0 ? $from.before(rowDepth) : $from.after(rowDepth);
      exampleRow.forEach(function (cell) {
        return cells.push(cell.type.createAndFill(cell.attrs));
      });
      var row = exampleRow.copy(Fragment.from(cells));
      pm.tr.step(new ReplaceStep(pos, pos, new Slice(Fragment.from(row), 0, 0))).apply();
    })();
  }
  return true;
}

// :: (ProseMirror, ?bool) → bool
// Command function that adds a row after the row with the
// selection.
function addRowBefore(pm, apply) {
  return addRow(pm, apply, -1);
}
exports.addRowBefore = addRowBefore;

// :: (ProseMirror, ?bool) → bool
// Command function that adds a row before the row with the
// selection.
function addRowAfter(pm, apply) {
  return addRow(pm, apply, 1);
}
exports.addRowAfter = addRowAfter;

// :: (ProseMirror, ?bool) → bool
// Command function that removes the row with the selection.
function removeRow(pm, apply) {
  var $from = pm.selection.$from;
  var rowDepth = findRow($from, function (d) {
    return $from.node(d - 1).childCount > 1;
  });
  if (rowDepth == -1) return false;
  if (apply !== false) pm.tr.step(new ReplaceStep($from.before(rowDepth), $from.after(rowDepth), Slice.empty)).apply();
  return true;
}
exports.removeRow = removeRow;

function moveCell(pm, dir, apply) {
  var $from = pm.selection.$from;

  var rowDepth = findRow($from);
  if (rowDepth == -1) return false;
  var row = $from.node(rowDepth),
      newIndex = $from.index(rowDepth) + dir;
  if (newIndex >= 0 && newIndex < row.childCount) {
    var $cellStart = pm.doc.resolve(row.content.offsetAt(newIndex) + $from.start(rowDepth));
    var sel = Selection.findFrom($cellStart, 1);
    if (!sel || sel.from >= $cellStart.end()) return false;
    if (apply !== false) pm.setSelection(sel);
    return true;
  } else {
    var rowIndex = $from.index(rowDepth - 1) + dir,
        table = $from.node(rowDepth - 1);
    if (rowIndex < 0 || rowIndex >= table.childCount) return false;
    var cellStart = dir > 0 ? $from.after(rowDepth) + 2 : $from.before(rowDepth) - 2 - table.child(rowIndex).lastChild.content.size;
    var _$cellStart = pm.doc.resolve(cellStart),
        _sel = Selection.findFrom(_$cellStart, 1);
    if (!_sel || _sel.from >= _$cellStart.end()) return false;
    if (apply !== false) pm.setSelection(_sel);
    return true;
  }
}

// :: (ProseMirror, ?bool) → bool
// Move to the next cell in the current table, if there is one.
function selectNextCell(pm, apply) {
  return moveCell(pm, 1, apply);
}
exports.selectNextCell = selectNextCell;

// :: (ProseMirror, ?bool) → bool
// Move to the previous cell in the current table, if there is one.
function selectPreviousCell(pm, apply) {
  return moveCell(pm, -1, apply);
}
exports.selectPreviousCell = selectPreviousCell;