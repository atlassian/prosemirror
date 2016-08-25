"use strict";

function elt(tag, attrs) {
  var result = document.createElement(tag);
  if (attrs) for (var name in attrs) {
    if (name == "style") result.style.cssText = attrs[name];else if (attrs[name] != null) result.setAttribute(name, attrs[name]);
  }

  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  for (var i = 0; i < args.length; i++) {
    add(args[i], result);
  }return result;
}
exports.elt = elt;

function add(value, target) {
  if (typeof value == "string") value = document.createTextNode(value);

  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      add(value[i], target);
    }
  } else {
    target.appendChild(value);
  }
}

var reqFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var cancelFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;

function requestAnimationFrame(f) {
  if (reqFrame) return reqFrame(f);else return setTimeout(f, 10);
}
exports.requestAnimationFrame = requestAnimationFrame;

function cancelAnimationFrame(handle) {
  if (reqFrame) return cancelFrame(handle);else clearTimeout(handle);
}
exports.cancelAnimationFrame = cancelAnimationFrame;

// : (DOMNode, DOMNode) → bool
// Check whether a DOM node is an ancestor of another DOM node.
function contains(parent, child) {
  // Android browser and IE will return false if child is a text node.
  if (child.nodeType != 1) child = child.parentNode;
  return child && parent.contains(child);
}
exports.contains = contains;

var accumulatedCSS = "",
    cssNode = null;

function insertCSS(pm, css) {
  if (pm.cssNode) pm.cssNode.textContent += css;else accumulatedCSS += css;
}
exports.insertCSS = insertCSS;

// This is called when a ProseMirror instance is created, to ensure
// the CSS is in the DOM.
function ensureCSSAdded(pm) {
  if (pm.cssNode) return;

  if (pm.root === document) {
    var _cssNode = document.head.querySelector('#pm-styles');

    if (_cssNode) {
      pm.cssNode = _cssNode;
    } else {
      pm.cssNode = document.createElement("style");
      pm.cssNode.textContent = "/* ProseMirror CSS */\n" + accumulatedCSS;
      pm.cssNode.id = 'pm-styles';
      document.head.insertBefore(pm.cssNode, document.head.firstChild);
    }
  } else {
    pm.cssNode = document.createElement("style");
    pm.cssNode.textContent = "/* ProseMirror CSS */\n" + accumulatedCSS;

    pm.wrapper.appendChild(pm.cssNode);
  }
}
exports.ensureCSSAdded = ensureCSSAdded;