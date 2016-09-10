"use strict";

var _require = require("../util/dom");

var contains = _require.contains;


function isEditorContent(dom) {
  return dom.classList.contains("ProseMirror-content");
}

// : (DOMNode) → number
// Get the position before a given a DOM node in a document.
function posBeforeFromDOM(node) {
  var pos = 0,
      add = 0;
  for (var cur = node; !isEditorContent(cur); cur = cur.parentNode) {
    var attr = cur.getAttribute("pm-offset");
    if (attr) {
      pos += +attr + add;add = 1;
    }
  }
  return pos;
}

var posFromDOMResult = { pos: 0, inLeaf: -1 };

// : (DOMNode, number) → number
function posFromDOM(dom, domOffset) {
  var bias = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

  if (domOffset == null) {
    domOffset = Array.prototype.indexOf.call(dom.parentNode.childNodes, dom);
    dom = dom.parentNode;
  }

  // Move up to the wrapping container, counting local offset along
  // the way.
  var innerOffset = 0,
      tag = void 0;
  for (;;) {
    var adjust = 0;
    if (dom.nodeType == 3) {
      innerOffset += domOffset;
    } else if (tag = dom.getAttribute("pm-offset") && !childContainer(dom)) {
      var size = +dom.getAttribute("pm-size");
      if (dom.nodeType == 1 && !dom.firstChild) innerOffset = bias > 0 ? size : 0;else if (domOffset == dom.childNodes.length) innerOffset = size;else innerOffset = Math.min(innerOffset, size);
      var inLeaf = posFromDOMResult.inLeaf = posBeforeFromDOM(dom);
      posFromDOMResult.pos = inLeaf + innerOffset;
      return posFromDOMResult;
    } else if (dom.hasAttribute("pm-container")) {
      break;
    } else if (domOffset == dom.childNodes.length) {
      if (domOffset) adjust = 1;else adjust = bias > 0 ? 1 : 0;
    }

    var parent = dom.parentNode;
    domOffset = adjust < 0 ? 0 : Array.prototype.indexOf.call(parent.childNodes, dom) + adjust;
    dom = parent;
    bias = 0;
  }

  var start = isEditorContent(dom) ? 0 : posBeforeFromDOM(dom) + 1,
      before = 0;

  for (var child = dom.childNodes[domOffset - 1]; child; child = child.previousSibling) {
    if (child.nodeType == 1 && (tag = child.getAttribute("pm-offset"))) {
      before += +tag + +child.getAttribute("pm-size");
      break;
    }
  }
  posFromDOMResult.inLeaf = -1;
  posFromDOMResult.pos = start + before + innerOffset;
  return posFromDOMResult;
}
exports.posFromDOM = posFromDOM;

// : (DOMNode) → ?DOMNode
function childContainer(dom) {
  return dom.hasAttribute("pm-container") ? dom : dom.querySelector("[pm-container]");
}
exports.childContainer = childContainer;

// : (ProseMirror, number) → {node: DOMNode, offset: number}
// Find the DOM node and offset into that node that the given document
// position refers to.
function DOMFromPos(pm, pos, loose) {
  if (!loose && pm.operation && pm.doc != pm.operation.doc) throw new RangeError("Resolving a position in an outdated DOM structure");

  var container = pm.content,
      offset = pos;
  for (;;) {
    for (var child = container.firstChild, i = 0;; child = child.nextSibling, i++) {
      if (!child) {
        if (offset && !loose) throw new RangeError("Failed to find node at " + pos);
        return { node: container, offset: i };
      }

      var size = child.nodeType == 1 && child.getAttribute("pm-size");
      if (size) {
        if (!offset) return { node: container, offset: i };
        size = +size;
        if (offset < size) {
          container = childContainer(child);
          if (!container) {
            return leafAt(child, offset);
          } else {
            offset--;
            break;
          }
        } else {
          offset -= size;
        }
      }
    }
  }
}
exports.DOMFromPos = DOMFromPos;

// : (ProseMirror, number) → {node: DOMNode, offset: number}
// The same as DOMFromPos, but searching from the bottom instead of
// the top. This is needed in domchange.js, when there is an arbitrary
// DOM change somewhere in our document, and we can no longer rely on
// the DOM structure around the selection.
function DOMFromPosFromEnd(pm, pos) {
  var container = pm.content,
      dist = (pm.operation ? pm.operation.doc : pm.doc).content.size - pos;
  for (;;) {
    for (var child = container.lastChild, i = container.childNodes.length;; child = child.previousSibling, i--) {
      if (!child) return { node: container, offset: i };

      var size = child.nodeType == 1 && child.getAttribute("pm-size");
      if (size) {
        if (!dist) return { node: container, offset: i };
        size = +size;
        if (dist < size) {
          container = childContainer(child);
          if (!container) {
            return leafAt(child, size - dist);
          } else {
            dist--;
            break;
          }
        } else {
          dist -= size;
        }
      }
    }
  }
}
exports.DOMFromPosFromEnd = DOMFromPosFromEnd;

// : (ProseMirror, number) → DOMNode
function DOMAfterPos(pm, pos) {
  var _DOMFromPos = DOMFromPos(pm, pos);

  var node = _DOMFromPos.node;
  var offset = _DOMFromPos.offset;

  if (node.nodeType != 1 || offset == node.childNodes.length) throw new RangeError("No node after pos " + pos);
  return node.childNodes[offset];
}
exports.DOMAfterPos = DOMAfterPos;

// : (DOMNode, number) → {node: DOMNode, offset: number}
function leafAt(node, offset) {
  for (;;) {
    var child = node.firstChild;
    if (!child) return { node: node, offset: offset };
    if (child.nodeType != 1) return { node: child, offset: offset };
    node = child;
  }
}

function windowRect() {
  return { left: 0, right: window.innerWidth,
    top: 0, bottom: window.innerHeight };
}

function parentNode(node) {
  var parent = node.parentNode;
  return parent.nodeType == 11 ? parent.host : parent;
}

function scrollIntoView(pm, pos) {
  if (!pos) pos = pm.sel.range.head || pm.sel.range.from;
  var coords = coordsAtPos(pm, pos);
  for (var parent = pm.content;; parent = parentNode(parent)) {
    var _pm$options = pm.options;
    var scrollThreshold = _pm$options.scrollThreshold;
    var scrollMargin = _pm$options.scrollMargin;

    var atBody = parent == document.body;
    var rect = atBody ? windowRect() : parent.getBoundingClientRect();
    var moveX = 0,
        moveY = 0;
    if (coords.top < rect.top + scrollThreshold) moveY = -(rect.top - coords.top + scrollMargin);else if (coords.bottom > rect.bottom - scrollThreshold) moveY = coords.bottom - rect.bottom + scrollMargin;
    if (coords.left < rect.left + scrollThreshold) moveX = -(rect.left - coords.left + scrollMargin);else if (coords.right > rect.right - scrollThreshold) moveX = coords.right - rect.right + scrollMargin;
    if (moveX || moveY) {
      if (atBody) {
        window.scrollBy(moveX, moveY);
      } else {
        if (moveY) parent.scrollTop += moveY;
        if (moveX) parent.scrollLeft += moveX;
      }
    }
    if (atBody) break;
  }
}
exports.scrollIntoView = scrollIntoView;

function findOffsetInNode(node, coords) {
  var closest = void 0,
      dxClosest = 2e8,
      coordsClosest = void 0,
      offset = 0;
  for (var child = node.firstChild, childIndex = 0; child; child = child.nextSibling, childIndex++) {
    var rects = void 0;
    if (child.nodeType == 1) rects = child.getClientRects();else if (child.nodeType == 3) rects = textRange(child).getClientRects();else continue;

    for (var i = 0; i < rects.length; i++) {
      var rect = rects[i];
      if (rect.top <= coords.top && rect.bottom >= coords.top) {
        var dx = rect.left > coords.left ? rect.left - coords.left : rect.right < coords.left ? coords.left - rect.right : 0;
        if (dx < dxClosest) {
          closest = child;
          dxClosest = dx;
          coordsClosest = dx && closest.nodeType == 3 ? { left: rect.right < coords.left ? rect.right : rect.left, top: coords.top } : coords;
          if (child.nodeType == 1 && dx) offset = childIndex + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0);
          continue;
        }
      }
      if (!closest && (coords.left >= rect.right || coords.left >= rect.left && coords.top >= rect.bottom)) offset = i + 1;
    }
  }
  if (closest && closest.nodeType == 3) return findOffsetInText(closest, coordsClosest);
  if (!closest || dxClosest && closest.nodeType == 1) return { node: node, offset: offset };
  return findOffsetInNode(closest, coordsClosest);
}

function findOffsetInText(node, coords) {
  var len = node.nodeValue.length;
  var range = document.createRange();
  for (var i = 0; i < len; i++) {
    range.setEnd(node, i + 1);
    range.setStart(node, i);
    var rect = singleRect(range, 1);
    if (rect.top == rect.bottom) continue;
    if (rect.left - 1 <= coords.left && rect.right + 1 >= coords.left && rect.top - 1 <= coords.top && rect.bottom + 1 >= coords.top) return { node: node, offset: i + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0) };
  }
  return { node: node, offset: 0 };
}

function targetKludge(dom, coords) {
  if (/^[uo]l$/i.test(dom.nodeName)) {
    for (var child = dom.firstChild; child; child = child.nextSibling) {
      if (child.nodeType != 1 || !child.hasAttribute("pm-offset") || !/^li$/i.test(child.nodeName)) continue;
      var childBox = child.getBoundingClientRect();
      if (coords.left > childBox.left - 2) break;
      if (childBox.top <= coords.top && childBox.bottom >= coords.top) return child;
    }
  }
  return dom;
}

// Given an x,y position on the editor, get the position in the document.
function posAtCoords(pm, coords) {
  var elt = targetKludge(pm.root.elementFromPoint(coords.left, coords.top + 1), coords);
  if (!contains(pm.content, elt)) return null;

  var _findOffsetInNode = findOffsetInNode(elt, coords);

  var node = _findOffsetInNode.node;
  var offset = _findOffsetInNode.offset;var bias = -1;
  if (node.nodeType == 1 && !node.firstChild) {
    var rect = node.getBoundingClientRect();
    bias = rect.left != rect.right && coords.left > (rect.left + rect.right) / 2 ? 1 : -1;
  }
  return posFromDOM(node, offset, bias);
}
exports.posAtCoords = posAtCoords;

function textRange(node, from, to) {
  var range = document.createRange();
  range.setEnd(node, to == null ? node.nodeValue.length : to);
  range.setStart(node, from || 0);
  return range;
}

function singleRect(object, bias) {
  var rects = object.getClientRects();
  return !rects.length ? object.getBoundingClientRect() : rects[bias < 0 ? 0 : rects.length - 1];
}

// : (ProseMirror, number) → ClientRect
// Given a position in the document model, get a bounding box of the
// character at that position, relative to the window.
function coordsAtPos(pm, pos) {
  var _DOMFromPos2 = DOMFromPos(pm, pos);

  var node = _DOMFromPos2.node;
  var offset = _DOMFromPos2.offset;

  var side = void 0,
      rect = void 0;
  if (node.nodeType == 3) {
    if (offset < node.nodeValue.length) {
      rect = singleRect(textRange(node, offset, offset + 1), -1);
      side = "left";
    }
    if ((!rect || rect.left == rect.right) && offset) {
      rect = singleRect(textRange(node, offset - 1, offset), 1);
      side = "right";
    }
  } else if (node.firstChild) {
    if (offset < node.childNodes.length) {
      var child = node.childNodes[offset];
      rect = singleRect(child.nodeType == 3 ? textRange(child) : child, -1);
      side = "left";
    }
    if ((!rect || rect.top == rect.bottom) && offset) {
      var _child = node.childNodes[offset - 1];
      rect = singleRect(_child.nodeType == 3 ? textRange(_child) : _child, 1);
      side = "right";
    }
  } else {
    rect = node.getBoundingClientRect();
    side = "left";
  }
  var x = rect[side];
  return { top: rect.top, bottom: rect.bottom, left: x, right: x };
}
exports.coordsAtPos = coordsAtPos;