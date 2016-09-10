"use strict";

var _require = require("../util/dom");

var elt = _require.elt;

var browser = require("../util/browser");

var _require2 = require("./dompos");

var childContainer = _require2.childContainer;


var DIRTY_RESCAN = 1,
    DIRTY_REDRAW = 2;
exports.DIRTY_RESCAN = DIRTY_RESCAN;exports.DIRTY_REDRAW = DIRTY_REDRAW;

function options(ranges) {
  return {
    pos: 0,

    onRender: function onRender(node, dom, _pos, offset) {
      if (node.isBlock) {
        if (offset != null) dom.setAttribute("pm-offset", offset);
        dom.setAttribute("pm-size", node.nodeSize);
        if (node.isTextblock) adjustTrailingHacks(dom, node);
        if (dom.contentEditable == "false") dom = elt("div", null, dom);
      }

      return dom;
    },
    onContainer: function onContainer(dom) {
      dom.setAttribute("pm-container", true);
    },

    // : (Node, DOMNode, number, number) → DOMNode
    renderInlineFlat: function renderInlineFlat(node, dom, pos, offset) {
      if (dom.nodeType != 1) dom = elt("span", null, dom);

      var end = pos + node.nodeSize,
          fragment = void 0;
      for (;;) {
        ranges.advanceTo(pos);
        var nextCut = ranges.nextChangeBefore(end),
            nextDOM = void 0,
            size = void 0;
        if (nextCut > -1) {
          size = nextCut - pos;
          nextDOM = splitTextNode(dom, size);
        } else {
          size = end - pos;
        }

        dom.setAttribute("pm-offset", offset);
        dom.setAttribute("pm-size", size);
        if (ranges.current.length) dom.className = ranges.current.join(" ");

        if (!fragment && (nextCut > -1 || ranges.element)) fragment = document.createDocumentFragment();
        if (ranges.element) fragment.appendChild(elt("span", { contenteditable: false, "pm-ignore": true }, ranges.element));
        if (fragment) fragment.appendChild(dom);

        if (nextCut == -1) break;
        offset += size;
        pos += size;
        dom = nextDOM;
      }

      return fragment || dom;
    },

    document: document
  };
}

function splitTextNode(dom, at) {
  if (dom.nodeType == 3) {
    var text = document.createTextNode(dom.nodeValue.slice(at));
    dom.nodeValue = dom.nodeValue.slice(0, at);
    return text;
  } else {
    var clone = dom.cloneNode(false);
    clone.appendChild(splitTextNode(dom.firstChild, at));
    return clone;
  }
}

function draw(pm, doc) {
  pm.content.textContent = "";
  pm.content.appendChild(doc.content.toDOM(options(pm.ranges.activeRangeTracker())));
}
exports.draw = draw;

function adjustTrailingHacks(dom, node) {
  var needs = node.content.size == 0 || node.lastChild.type.isBR || node.type.isCode && node.lastChild.isText && /\n$/.test(node.lastChild.text) ? "br" : !node.lastChild.isText && node.lastChild.type.isLeaf ? "text" : null;
  var last = dom.lastChild;
  var has = !last || last.nodeType != 1 || !last.hasAttribute("pm-ignore") ? null : last.nodeName == "BR" ? "br" : "text";
  if (needs != has) {
    if (has) dom.removeChild(last);
    if (needs) dom.appendChild(needs == "br" ? elt("br", { "pm-ignore": "trailing-break" }) : elt("span", { "pm-ignore": "cursor-text" }, ""));
  }
}

function findNodeIn(parent, i, node) {
  for (; i < parent.childCount; i++) {
    var child = parent.child(i);
    if (child == node) return i;
  }
  return -1;
}

function movePast(dom) {
  var next = dom.nextSibling;
  dom.parentNode.removeChild(dom);
  return next;
}

function redraw(pm, dirty, doc, prev) {
  if (dirty.get(prev) == DIRTY_REDRAW) return draw(pm, doc);

  var opts = options(pm.ranges.activeRangeTracker());

  function scan(dom, node, prev, pos) {
    var iPrev = 0,
        oPrev = 0,
        pChild = prev.firstChild;
    var domPos = dom.firstChild;

    function syncDOM() {
      while (domPos) {
        var curOff = domPos.nodeType == 1 && domPos.getAttribute("pm-offset");
        if (!curOff || +curOff < oPrev) domPos = movePast(domPos);else return +curOff == oPrev;
      }
      return false;
    }

    for (var iNode = 0, offset = 0; iNode < node.childCount; iNode++) {
      var child = node.child(iNode),
          matching = void 0,
          reuseDOM = void 0;
      var found = pChild == child ? iPrev : findNodeIn(prev, iPrev + 1, child);
      if (found > -1) {
        matching = child;
        while (iPrev != found) {
          oPrev += pChild.nodeSize;
          pChild = prev.maybeChild(++iPrev);
        }
      }

      if (matching && !dirty.get(matching) && syncDOM()) {
        reuseDOM = true;
      } else if (pChild && !child.isText && child.sameMarkup(pChild) && dirty.get(pChild) != DIRTY_REDRAW && syncDOM()) {
        reuseDOM = true;
        if (!pChild.type.isLeaf) scan(childContainer(domPos), child, pChild, pos + offset + 1);
        domPos.setAttribute("pm-size", child.nodeSize);
      } else {
        opts.pos = pos + offset;
        opts.offset = offset;
        var rendered = child.toDOM(opts);
        dom.insertBefore(rendered, domPos);
        reuseDOM = false;
      }

      if (reuseDOM) {
        // Text nodes might be split into smaller segments
        if (child.isText) {
          for (var off = offset, end = off + child.nodeSize; off < end;) {
            if (offset != oPrev) domPos.setAttribute("pm-offset", off);
            off += +domPos.getAttribute("pm-size");
            domPos = domPos.nextSibling;
          }
        } else {
          if (offset != oPrev) domPos.setAttribute("pm-offset", offset);
          domPos = domPos.nextSibling;
        }
        oPrev += pChild.nodeSize;
        pChild = prev.maybeChild(++iPrev);
      }
      offset += child.nodeSize;
    }

    while (domPos) {
      domPos = movePast(domPos);
    }if (node.isTextblock) adjustTrailingHacks(dom, node);

    if (browser.ios) iosHacks(dom);
  }
  scan(pm.content, doc, prev, 0);
}
exports.redraw = redraw;

function iosHacks(dom) {
  if (dom.nodeName == "UL" || dom.nodeName == "OL") {
    var oldCSS = dom.style.cssText;
    dom.style.cssText = oldCSS + "; list-style: square !important";
    window.getComputedStyle(dom).listStyle;
    dom.style.cssText = oldCSS;
  }
}