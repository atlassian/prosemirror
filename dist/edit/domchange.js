"use strict";

var _require = require("../model");

var Mark = _require.Mark;

var _require2 = require("../transform");

var mapThroughResult = _require2.mapThroughResult;

var _require3 = require("./selection");

var findSelectionFrom = _require3.findSelectionFrom;
var findSelectionNear = _require3.findSelectionNear;
var TextSelection = _require3.TextSelection;
var isCollapsed = _require3.isCollapsed;

var _require4 = require("./dompos");

var DOMFromPos = _require4.DOMFromPos;
var DOMFromPosFromEnd = _require4.DOMFromPosFromEnd;


function readInputChange(pm) {
  pm.ensureOperation({ readSelection: false });
  return readDOMChange(pm, rangeAroundSelection(pm));
}
exports.readInputChange = readInputChange;

function readCompositionChange(pm, margin) {
  return readDOMChange(pm, rangeAroundComposition(pm, margin));
}
exports.readCompositionChange = readCompositionChange;

// Note that all referencing and parsing is done with the
// start-of-operation selection and document, since that's the one
// that the DOM represents. If any changes came in in the meantime,
// the modification is mapped over those before it is applied, in
// readDOMChange.

function parseBetween(pm, from, to) {
  var _DOMFromPos = DOMFromPos(pm, from, true);

  var parent = _DOMFromPos.node;
  var startOff = _DOMFromPos.offset;

  var _DOMFromPosFromEnd = DOMFromPosFromEnd(pm, to);

  var parentRight = _DOMFromPosFromEnd.node;
  var endOff = _DOMFromPosFromEnd.offset;

  if (parent != parentRight) return null;
  while (startOff) {
    var prev = parent.childNodes[startOff - 1];
    if (prev.nodeType != 1 || !prev.hasAttribute("pm-offset")) --startOff;else break;
  }
  while (endOff < parent.childNodes.length) {
    var next = parent.childNodes[endOff];
    if (next.nodeType != 1 || !next.hasAttribute("pm-offset")) ++endOff;else break;
  }
  var domSel = pm.root.getSelection(),
      find = null;
  if (domSel.anchorNode && pm.content.contains(domSel.anchorNode)) {
    find = [{ node: domSel.anchorNode, offset: domSel.anchorOffset }];
    if (!isCollapsed(domSel)) find.push({ node: domSel.focusNode, offset: domSel.focusOffset });
  }
  var sel = null,
      doc = pm.schema.parseDOM(parent, {
    topNode: pm.operation.doc.resolve(from).parent.copy(),
    from: startOff,
    to: endOff,
    preserveWhitespace: true,
    editableContent: true,
    findPositions: find
  });
  if (find && find[0].pos != null) {
    var anchor = find[0].pos,
        head = find[1] && find[1].pos;
    if (head == null) head = anchor;
    sel = { anchor: anchor, head: head };
  }
  return { doc: doc, sel: sel };
}

function isAtEnd($pos, depth) {
  for (var i = depth || 0; i < $pos.depth; i++) {
    if ($pos.index(i) + 1 < $pos.node(i).childCount) return false;
  }return $pos.parentOffset == $pos.parent.content.size;
}
function isAtStart($pos, depth) {
  for (var i = depth || 0; i < $pos.depth; i++) {
    if ($pos.index(0) > 0) return false;
  }return $pos.parentOffset == 0;
}

function rangeAroundSelection(pm) {
  var _pm$operation$sel = pm.operation.sel;
  var $from = _pm$operation$sel.$from;
  var $to = _pm$operation$sel.$to;
  // When the selection is entirely inside a text block, use
  // rangeAroundComposition to get a narrow range.

  if ($from.sameParent($to) && $from.parent.isTextblock && $from.parentOffset && $to.parentOffset < $to.parent.content.size) return rangeAroundComposition(pm, 0);

  for (var depth = 0;; depth++) {
    var fromStart = isAtStart($from, depth + 1),
        toEnd = isAtEnd($to, depth + 1);
    if (fromStart || toEnd || $from.index(depth) != $to.index(depth) || $to.node(depth).isTextblock) {
      var from = $from.before(depth + 1),
          to = $to.after(depth + 1);
      if (fromStart && $from.index(depth) > 0) from -= $from.node(depth).child($from.index(depth) - 1).nodeSize;
      if (toEnd && $to.index(depth) + 1 < $to.node(depth).childCount) to += $to.node(depth).child($to.index(depth) + 1).nodeSize;
      return { from: from, to: to };
    }
  }
}

function rangeAroundComposition(pm, margin) {
  var _pm$operation$sel2 = pm.operation.sel;
  var $from = _pm$operation$sel2.$from;
  var $to = _pm$operation$sel2.$to;

  if (!$from.sameParent($to)) return rangeAroundSelection(pm);
  var startOff = Math.max(0, $from.parentOffset - margin);
  var size = $from.parent.content.size;
  var endOff = Math.min(size, $to.parentOffset + margin);

  if (startOff > 0) startOff = $from.parent.childBefore(startOff).offset;
  if (endOff < size) {
    var after = $from.parent.childAfter(endOff);
    endOff = after.offset + after.node.nodeSize;
  }
  var nodeStart = $from.start();
  return { from: nodeStart + startOff, to: nodeStart + endOff };
}

function readDOMChange(pm, range) {
  var op = pm.operation;
  // If the document was reset since the start of the current
  // operation, we can't do anything useful with the change to the
  // DOM, so we discard it.
  if (op.docSet) {
    pm.markAllDirty();
    return false;
  }

  var parseResult = void 0;
  for (;;) {
    parseResult = parseBetween(pm, range.from, range.to);
    if (parseResult) break;
    range = { from: op.doc.resolve(range.from).before(),
      to: op.doc.resolve(range.to).after() };
  }
  var _parseResult = parseResult;
  var parsed = _parseResult.doc;
  var parsedSel = _parseResult.sel;


  var compare = op.doc.slice(range.from, range.to);
  var change = findDiff(compare.content, parsed.content, range.from, op.sel.from);
  if (!change) return false;
  var fromMapped = mapThroughResult(op.mappings, change.start);
  var toMapped = mapThroughResult(op.mappings, change.endA);
  if (fromMapped.deleted && toMapped.deleted) return false;

  // Mark nodes touched by this change as 'to be redrawn'
  markDirtyFor(pm, op.doc, change.start, change.endA);

  function newSelection(doc) {
    if (!parsedSel) return false;
    var newSel = findSelectionNear(doc.resolve(range.from + parsedSel.head));
    if (parsedSel.anchor != parsedSel.head && newSel.$head) {
      var $anchor = doc.resolve(range.from + parsedSel.anchor);
      if ($anchor.parent.isTextblock) newSel = new TextSelection($anchor, newSel.$head);
    }
    return newSel;
  }

  var $from = parsed.resolveNoCache(change.start - range.from);
  var $to = parsed.resolveNoCache(change.endB - range.from);
  var nextSel = void 0,
      text = void 0;
  // If this looks like the effect of pressing Enter, just dispatch an
  // Enter key instead.
  if (!$from.sameParent($to) && $from.pos < parsed.content.size && (nextSel = findSelectionFrom(parsed.resolve($from.pos + 1), 1, true)) && nextSel.head == $to.pos) {
    pm.input.dispatchKey("Enter");
  } else if ($from.sameParent($to) && $from.parent.isTextblock && (text = uniformTextBetween(parsed, $from.pos, $to.pos)) != null) {
    pm.input.insertText(fromMapped.pos, toMapped.pos, text, newSelection);
  } else {
    var slice = parsed.slice(change.start - range.from, change.endB - range.from);
    var tr = pm.tr.replace(fromMapped.pos, toMapped.pos, slice);
    var sel = newSelection(tr.doc);
    if (sel) tr.setSelection(sel);
    tr.applyAndScroll();
  }
  return true;
}

function uniformTextBetween(node, from, to) {
  var result = "",
      valid = true,
      marks = null;
  node.nodesBetween(from, to, function (node, pos) {
    if (!node.isInline && pos < from) return;
    if (!node.isText) return valid = false;
    if (!marks) marks = node.marks;else if (!Mark.sameSet(marks, node.marks)) valid = false;
    result += node.text.slice(Math.max(0, from - pos), to - pos);
  });
  return valid ? result : null;
}

function findDiff(a, b, pos, preferedStart) {
  var start = a.findDiffStart(b, pos);
  if (!start) return null;

  var _a$findDiffEnd = a.findDiffEnd(b, pos + a.size, pos + b.size);

  var endA = _a$findDiffEnd.a;
  var endB = _a$findDiffEnd.b;

  if (endA < start) {
    var move = preferedStart <= start && preferedStart >= endA ? start - preferedStart : 0;
    start -= move;
    endB = start + (endB - endA);
    endA = start;
  } else if (endB < start) {
    var _move = preferedStart <= start && preferedStart >= endB ? start - preferedStart : 0;
    start -= _move;
    endA = start + (endA - endB);
    endB = start;
  }
  return { start: start, endA: endA, endB: endB };
}

function markDirtyFor(pm, doc, start, end) {
  var $start = doc.resolve(start),
      $end = doc.resolve(end),
      same = $start.sameDepth($end);
  if (same == 0) pm.markAllDirty();else pm.markRangeDirty($start.before(same), $start.after(same), doc);
}