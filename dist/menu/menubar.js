"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("../edit");

var Plugin = _require.Plugin;

var _require2 = require("../util/dom");

var elt = _require2.elt;
var insertCSS = _require2.insertCSS;

var _require3 = require("./menu");

var renderGrouped = _require3.renderGrouped;


var prefix = "ProseMirror-menubar";

var MenuBar = function () {
  function MenuBar(pm, config) {
    var _this = this;

    _classCallCheck(this, MenuBar);

    this.pm = pm;

    this.wrapper = pm.wrapper.insertBefore(elt("div", { class: prefix }), pm.wrapper.firstChild);
    this.spacer = null;
    this.maxHeight = 0;
    this.widthForMaxHeight = 0;

    this.updater = pm.updateScheduler([pm.on.selectionChange, pm.on.change, pm.on.activeMarkChange], function () {
      return _this.update();
    });
    this.content = config.content;
    this.updater.force();

    this.floating = false;
    if (config.float) {
      this.updateFloat();
      this.scrollFunc = function () {
        if (!document.body.contains(_this.pm.wrapper)) window.removeEventListener("scroll", _this.scrollFunc);else _this.updateFloat();
      };
      window.addEventListener("scroll", this.scrollFunc);
    }
  }

  _createClass(MenuBar, [{
    key: "detach",
    value: function detach() {
      this.updater.detach();
      this.wrapper.parentNode.removeChild(this.wrapper);
      if (this.spacer) this.spacer.parentNode.removeChild(this.spacer);

      if (this.scrollFunc) window.removeEventListener("scroll", this.scrollFunc);
    }
  }, {
    key: "update",
    value: function update() {
      var _this2 = this;

      this.wrapper.textContent = "";
      this.wrapper.appendChild(renderGrouped(this.pm, this.content));

      return this.floating ? this.updateScrollCursor() : function () {
        if (_this2.wrapper.offsetWidth != _this2.widthForMaxHeight) {
          _this2.widthForMaxHeight = _this2.wrapper.offsetWidth;
          _this2.maxHeight = 0;
        }
        if (_this2.wrapper.offsetHeight > _this2.maxHeight) {
          _this2.maxHeight = _this2.wrapper.offsetHeight;
          return function () {
            _this2.wrapper.style.minHeight = _this2.maxHeight + "px";
          };
        }
      };
    }
  }, {
    key: "updateFloat",
    value: function updateFloat() {
      var editorRect = this.pm.wrapper.getBoundingClientRect();
      if (this.floating) {
        if (editorRect.top >= 0 || editorRect.bottom < this.wrapper.offsetHeight + 10) {
          this.floating = false;
          this.wrapper.style.position = this.wrapper.style.left = this.wrapper.style.width = "";
          this.wrapper.style.display = "";
          this.spacer.parentNode.removeChild(this.spacer);
          this.spacer = null;
        } else {
          var border = (this.pm.wrapper.offsetWidth - this.pm.wrapper.clientWidth) / 2;
          this.wrapper.style.left = editorRect.left + border + "px";
          this.wrapper.style.display = editorRect.top > window.innerHeight ? "none" : "";
        }
      } else {
        if (editorRect.top < 0 && editorRect.bottom >= this.wrapper.offsetHeight + 10) {
          this.floating = true;
          var menuRect = this.wrapper.getBoundingClientRect();
          this.wrapper.style.left = menuRect.left + "px";
          this.wrapper.style.width = menuRect.width + "px";
          this.wrapper.style.position = "fixed";
          this.spacer = elt("div", { class: prefix + "-spacer", style: "height: " + menuRect.height + "px" });
          this.pm.wrapper.insertBefore(this.spacer, this.wrapper);
        }
      }
    }
  }, {
    key: "updateScrollCursor",
    value: function updateScrollCursor() {
      var _this3 = this;

      if (!this.floating) return null;
      var head = this.pm.selection.head;
      if (!head) return null;
      return function () {
        var cursorPos = _this3.pm.coordsAtPos(head);
        var menuRect = _this3.wrapper.getBoundingClientRect();
        if (cursorPos.top < menuRect.bottom && cursorPos.bottom > menuRect.top) {
          var _ret = function () {
            var scrollable = findWrappingScrollable(_this3.pm.wrapper);
            if (scrollable) return {
                v: function v() {
                  scrollable.scrollTop -= menuRect.bottom - cursorPos.top;
                }
              };
          }();

          if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
        }
      };
    }
  }]);

  return MenuBar;
}();

function findWrappingScrollable(node) {
  for (var cur = node.parentNode; cur; cur = cur.parentNode) {
    if (cur.scrollHeight > cur.clientHeight) return cur;
  }
}

// :: Plugin
// Plugin that enables the menu bar for an editor. The menu bar takes
// up space above the editor, showing currently available commands
// (that have been [added](#CommandSpec.menuGroup) to the menu). The
// following options are supported:
//
// **`float`**`: bool = false`
//   : When enabled, causes the menu bar to stay visible when the
//     editor is partially scrolled out of view, by making it float at
//     the top of the viewport.
//
// **`content`**`: [`[`MenuGroup`](#MenuGroup)`]`
//   : Determines the content of the menu.
var menuBar = new Plugin(MenuBar, {
  content: [],
  float: false
});
exports.menuBar = menuBar;

insertCSS("\n." + prefix + " {\n  border-top-left-radius: inherit;\n  border-top-right-radius: inherit;\n  position: relative;\n  min-height: 1em;\n  color: #666;\n  padding: 1px 6px;\n  top: 0; left: 0; right: 0;\n  border-bottom: 1px solid silver;\n  background: white;\n  z-index: 10;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  overflow: visible;\n}\n");