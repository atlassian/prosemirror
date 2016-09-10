"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("../util/dom");

var elt = _require.elt;
var insertCSS = _require.insertCSS;

// ;; This class represents a dialog that prompts for a set of
// fields.

var FieldPrompt = function () {
  // :: (ProseMirror, string, [Field])
  // Construct a prompt. Note that this does not
  // [open](#FieldPrompt.open) it yet.

  function FieldPrompt(pm, title, fields) {
    var _this = this;

    _classCallCheck(this, FieldPrompt);

    this.pm = pm;
    this.title = title;
    this.fields = fields;
    this.doClose = null;
    this.domFields = [];
    for (var name in fields) {
      this.domFields.push(fields[name].render(pm));
    }var promptTitle = elt("h5", {}, pm.translate(title));
    var submitButton = elt("button", { type: "submit", class: "ProseMirror-prompt-submit" }, "Ok");
    var cancelButton = elt("button", { type: "button", class: "ProseMirror-prompt-cancel" }, "Cancel");
    cancelButton.addEventListener("click", function () {
      return _this.close();
    });
    // :: DOMNode
    // An HTML form wrapping the fields.
    this.form = elt("form", null, promptTitle, this.domFields.map(function (f) {
      return elt("div", null, f);
    }), elt("div", { class: "ProseMirror-prompt-buttons" }, submitButton, " ", cancelButton));
  }

  // :: ()
  // Close the prompt.


  _createClass(FieldPrompt, [{
    key: "close",
    value: function close() {
      if (this.doClose) {
        this.doClose();
        this.doClose = null;
      }
    }

    // :: ()
    // Open the prompt's dialog.

  }, {
    key: "open",
    value: function open(callback) {
      var _this2 = this;

      this.close();
      var prompt = this.prompt();
      var hadFocus = this.pm.hasFocus();
      this.doClose = function () {
        prompt.close();
        if (hadFocus) setTimeout(function () {
          return _this2.pm.focus();
        }, 50);
      };

      var submit = function submit() {
        var params = _this2.values();
        if (params) {
          _this2.close();
          callback(params);
        }
      };

      this.form.addEventListener("submit", function (e) {
        e.preventDefault();
        submit();
      });

      this.form.addEventListener("keydown", function (e) {
        if (e.keyCode == 27) {
          e.preventDefault();
          prompt.close();
        } else if (e.keyCode == 13 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
          e.preventDefault();
          submit();
        }
      });

      var input = this.form.elements[0];
      if (input) input.focus();
    }

    // :: () → ?[any]
    // Read the values from the form's field. Validate them, and when
    // one isn't valid (either has a validate function that produced an
    // error message, or has no validate function, no value, and no
    // default value), show the problem to the user and return `null`.

  }, {
    key: "values",
    value: function values() {
      var result = Object.create(null),
          i = 0;
      for (var name in this.fields) {
        var field = this.fields[name],
            dom = this.domFields[i++];
        var value = field.read(dom),
            bad = field.validate(value);
        if (bad) {
          this.reportInvalid(dom, this.pm.translate(bad));
          return null;
        }
        result[name] = field.clean(value);
      }
      return result;
    }

    // :: () → {close: ()}
    // Open a prompt with the parameter form in it. The default
    // implementation calls `openPrompt`.

  }, {
    key: "prompt",
    value: function prompt() {
      var _this3 = this;

      return openPrompt(this.pm, this.form, { onClose: function onClose() {
          return _this3.close();
        } });
    }

    // :: (DOMNode, string)
    // Report a field as invalid, showing the given message to the user.

  }, {
    key: "reportInvalid",
    value: function reportInvalid(dom, message) {
      // FIXME this is awful and needs a lot more work
      var parent = dom.parentNode;
      var style = "left: " + (dom.offsetLeft + dom.offsetWidth + 2) + "px; top: " + (dom.offsetTop - 5) + "px";
      var msg = parent.appendChild(elt("div", { class: "ProseMirror-invalid", style: style }, message));
      setTimeout(function () {
        return parent.removeChild(msg);
      }, 1500);
    }
  }]);

  return FieldPrompt;
}();

exports.FieldPrompt = FieldPrompt;

// ;; The type of field that `FieldPrompt` expects to be passed to it.

var Field = function () {
  // :: (Object)
  // Create a field with the given options. Options support by all
  // field types are:
  //
  // **`value`**`: ?any`
  //   : The starting value for the field.
  //
  // **`label`**`: string`
  //   : The label for the field.
  //
  // **`required`**`: ?bool`
  //   : Whether the field is required.
  //
  // **`validate`**`: ?(any) → ?string`
  //   : A function to validate the given value. Should return an
  //     error message if it is not valid.

  function Field(options) {
    _classCallCheck(this, Field);

    this.options = options;
  }

  // :: (pm: ProseMirror) → DOMNode #path=Field.prototype.render
  // Render the field to the DOM. Should be implemented by all subclasses.

  // :: (DOMNode) → any
  // Read the field's value from its DOM node.


  _createClass(Field, [{
    key: "read",
    value: function read(dom) {
      return dom.value;
    }

    // :: (any) → ?string
    // A field-type-specific validation function.

  }, {
    key: "validateType",
    value: function validateType(_value) {}
  }, {
    key: "validate",
    value: function validate(value) {
      if (!value && this.options.required) return "Required field";
      return this.validateType(value) || this.options.validate && this.options.validate(value);
    }
  }, {
    key: "clean",
    value: function clean(value) {
      return this.options.clean ? this.options.clean(value) : value;
    }
  }]);

  return Field;
}();

exports.Field = Field;

// ;; A field class for single-line text fields.

var TextField = function (_Field) {
  _inherits(TextField, _Field);

  function TextField() {
    _classCallCheck(this, TextField);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TextField).apply(this, arguments));
  }

  _createClass(TextField, [{
    key: "render",
    value: function render(pm) {
      return elt("input", { type: "text",
        placeholder: pm.translate(this.options.label),
        value: this.options.value || "",
        autocomplete: "off" });
    }
  }]);

  return TextField;
}(Field);

exports.TextField = TextField;

// ;; A field class for dropdown fields based on a plain `<select>`
// tag. Expects an option `options`, which should be an array of
// `{value: string, label: string}` objects, or a function taking a
// `ProseMirror` instance and returning such an array.

var SelectField = function (_Field2) {
  _inherits(SelectField, _Field2);

  function SelectField() {
    _classCallCheck(this, SelectField);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(SelectField).apply(this, arguments));
  }

  _createClass(SelectField, [{
    key: "render",
    value: function render(pm) {
      var opts = this.options;
      var options = opts.options.call ? opts.options(pm) : opts.options;
      return elt("select", null, options.map(function (o) {
        return elt("option", { value: o.value, selected: o.value == opts.value ? "true" : null }, pm.translate(o.label));
      }));
    }
  }]);

  return SelectField;
}(Field);

exports.SelectField = SelectField;

// :: (ProseMirror, DOMNode, ?Object) → {close: ()}
// Open a dialog box for the given editor, putting `content` inside of
// it. The `close` method on the return value can be used to
// explicitly close the dialog again. The following options are
// supported:
//
// **`pos`**`: {left: number, top: number}`
//   : Provide an explicit position for the element. By default, it'll
//     be placed in the center of the editor.
//
// **`onClose`**`: fn()`
//   : A function to be called when the dialog is closed.
function openPrompt(pm, content, options) {
  var button = elt("button", { class: "ProseMirror-prompt-close" });
  var wrapper = elt("div", { class: "ProseMirror-prompt" }, content, button);
  var outerBox = pm.wrapper.getBoundingClientRect();

  pm.wrapper.appendChild(wrapper);
  if (options && options.pos) {
    wrapper.style.left = options.pos.left - outerBox.left + "px";
    wrapper.style.top = options.pos.top - outerBox.top + "px";
  } else {
    var blockBox = wrapper.getBoundingClientRect();
    var cX = Math.max(0, outerBox.left) + Math.min(window.innerWidth, outerBox.right) - blockBox.width;
    var cY = Math.max(0, outerBox.top) + Math.min(window.innerHeight, outerBox.bottom) - blockBox.height;
    wrapper.style.left = cX / 2 - outerBox.left + "px";
    wrapper.style.top = cY / 2 - outerBox.top + "px";
  }

  var close = function close() {
    pm.on.interaction.remove(close);
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
      if (options && options.onClose) options.onClose();
    }
  };
  button.addEventListener("click", close);
  pm.on.interaction.add(close);
  return { close: close };
}
exports.openPrompt = openPrompt;

insertCSS("\n.ProseMirror-prompt {\n  background: white;\n  padding: 2px 6px 2px 15px;\n  border: 1px solid silver;\n  position: absolute;\n  border-radius: 3px;\n  z-index: 11;\n}\n\n.ProseMirror-prompt h5 {\n  margin: 0;\n  font-weight: normal;\n  font-size: 100%;\n  color: #444;\n}\n\n.ProseMirror-prompt input[type=\"text\"],\n.ProseMirror-prompt textarea {\n  background: #eee;\n  border: none;\n  outline: none;\n}\n\n.ProseMirror-prompt input[type=\"text\"] {\n  padding: 0 4px;\n}\n\n.ProseMirror-prompt-close {\n  position: absolute;\n  left: 2px; top: 1px;\n  color: #666;\n  border: none; background: transparent; padding: 0;\n}\n\n.ProseMirror-prompt-close:after {\n  content: \"✕\";\n  font-size: 12px;\n}\n\n.ProseMirror-invalid {\n  background: #ffc;\n  border: 1px solid #cc7;\n  border-radius: 4px;\n  padding: 5px 10px;\n  position: absolute;\n  min-width: 10em;\n}\n\n.ProseMirror-prompt-buttons {\n  margin-top: 5px;\n  display: none;\n}\n\n");