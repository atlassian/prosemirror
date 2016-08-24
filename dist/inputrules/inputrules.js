"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("../edit");

var Keymap = _require.Keymap;
var Plugin = _require.Plugin;

// ;; Input rules are regular expressions describing a piece of text
// that, when typed, causes something to happen. This might be
// changing two dashes into an emdash, wrapping a paragraph starting
// with `"> "` into a blockquote, or something entirely different.

var InputRule =
// :: (RegExp, ?string, union<string, (pm: ProseMirror, match: [string], pos: number)>)
// Create an input rule. The rule applies when the user typed
// something and the text directly in front of the cursor matches
// `match`, which should probably end with `$`. You can optionally
// provide a filter, which should be a single character that always
// appears at the end of the match, and will be used to only apply
// the rule when there's an actual chance of it succeeding.
//
// The `handler` can be a string, in which case the matched text
// will simply be replaced by that string, or a function, which will
// be called with the match array produced by
// [`RegExp.exec`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec),
// and should produce the effect of the rule.
function InputRule(match, filter, handler) {
  _classCallCheck(this, InputRule);

  this.filter = filter;
  this.match = match;
  this.handler = handler;
};

exports.InputRule = InputRule;

// ;; Manages the set of active input rules for an editor. Created
// with the `inputRules` plugin.

var InputRules = function () {
  function InputRules(pm, options) {
    var _this = this;

    _classCallCheck(this, InputRules);

    this.pm = pm;
    this.rules = [];
    this.cancelVersion = null;

    pm.on.selectionChange.add(this.onSelChange = function () {
      return _this.cancelVersion = null;
    });
    pm.on.textInput.add(this.onTextInput = this.onTextInput.bind(this));
    pm.addKeymap(new Keymap({ Backspace: function Backspace(pm) {
        return _this.backspace(pm);
      } }, { name: "inputRules" }), 20);

    options.rules.forEach(function (rule) {
      return _this.addRule(rule);
    });
  }

  _createClass(InputRules, [{
    key: "detach",
    value: function detach() {
      this.pm.on.selectionChange.remove(this.onSelChange);
      this.pm.on.textInput.remove(this.onTextInput);
      this.pm.removeKeymap("inputRules");
    }

    // :: (InputRule)
    // Add the given input rule to the editor.

  }, {
    key: "addRule",
    value: function addRule(rule) {
      this.rules.push(rule);
    }

    // :: (InputRule) → bool
    // Remove the given input rule from the editor. Returns false if the
    // rule wasn't found.

  }, {
    key: "removeRule",
    value: function removeRule(rule) {
      var found = this.rules.indexOf(rule);
      if (found > -1) {
        this.rules.splice(found, 1);
        return true;
      }
      return false;
    }
  }, {
    key: "onTextInput",
    value: function onTextInput(text) {
      var $pos = this.pm.selection.$head;
      if (!$pos) return;

      var textBefore = void 0,
          isCode = void 0;
      var lastCh = text[text.length - 1];

      for (var i = 0; i < this.rules.length; i++) {
        var rule = this.rules[i],
            match = void 0;
        if (rule.filter && rule.filter != lastCh) continue;
        if (textBefore == null) {
          ;
          var _getContext = getContext($pos);

          textBefore = _getContext.textBefore;
          isCode = _getContext.isCode;

          if (isCode) return;
        }
        if (match = rule.match.exec(textBefore)) {
          var startVersion = this.pm.history.getVersion();
          if (typeof rule.handler == "string") {
            var start = $pos.pos - (match[1] || match[0]).length;
            var marks = this.pm.doc.marksAt($pos.pos);
            this.pm.tr.delete(start, $pos.pos).insert(start, this.pm.schema.text(rule.handler, marks)).apply();
          } else {
            rule.handler(this.pm, match, $pos.pos);
          }
          this.cancelVersion = startVersion;
          return;
        }
      }
    }
  }, {
    key: "backspace",
    value: function backspace() {
      if (this.cancelVersion) {
        this.pm.history.backToVersion(this.cancelVersion);
        this.cancelVersion = null;
      } else {
        return false;
      }
    }
  }]);

  return InputRules;
}();

function getContext($pos) {
  var parent = $pos.parent,
      isCode = parent.type.isCode;
  var textBefore = "";
  for (var i = 0, rem = $pos.parentOffset; rem > 0; i++) {
    var child = parent.child(i);
    if (child.isText) textBefore += child.text.slice(0, rem);else textBefore += "￼";
    rem -= child.nodeSize;
    if (rem <= 0 && child.marks.some(function (st) {
      return st.type.isCode;
    })) isCode = true;
  }
  return { textBefore: textBefore, isCode: isCode };
}

// :: Plugin
// A plugin for adding input rules to an editor. A common pattern of
// use is to call `inputRules.ensure(editor).addRule(...)` to get an
// instance of the plugin state and add a rule to it.
//
// Takes a single option, `rules`, which may be an array of
// `InputRules` objects to initially add.
var inputRules = new Plugin(InputRules, {
  rules: []
});
exports.inputRules = inputRules;