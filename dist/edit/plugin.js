"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var pluginProps = Object.create(null);

// Each plugin gets assigned a unique property name, so that its state
// can be stored in the editor's `plugin` object.
function registerProp() {
  var name = arguments.length <= 0 || arguments[0] === undefined ? "plugin" : arguments[0];

  for (var i = 1;; i++) {
    var prop = name + (i > 1 ? "_" + i : "");
    if (!(prop in pluginProps)) return pluginProps[prop] = prop;
  }
}

// ;; A plugin is a piece of functionality that can be attached to a
// ProseMirror instance. It may do something like show a
// [menu](#menubar) or wire in [collaborative editing](#collab). The
// plugin object is the interface to enabling and disabling the
// plugin, and for those where this is relevant, for accessing its
// state.

var Plugin = function () {
  // :: (constructor, ?Object)
  // Create a plugin object for the given state class. If desired, you
  // can pass a collection of options. When initializing the plugin,
  // it will receive the ProseMirror instance and the options as
  // arguments to its constructor.

  function Plugin(State, options, prop) {
    _classCallCheck(this, Plugin);

    this.State = State;
    this.options = options || Object.create(null);
    this.prop = prop || registerProp(State.name);
  }

  // :: (ProseMirror) → ?any
  // Return the plugin state for the given editor, if any.


  _createClass(Plugin, [{
    key: "get",
    value: function get(pm) {
      return pm.plugin[this.prop];
    }

    // :: (ProseMirror) → any
    // Initialize the plugin for the given editor. If it was already
    // enabled, this throws an error.

  }, {
    key: "attach",
    value: function attach(pm) {
      if (this.get(pm)) throw new RangeError("Attaching plugin multiple times");
      return pm.plugin[this.prop] = new this.State(pm, this.options);
    }

    // :: (ProseMirror)
    // Disable the plugin in the given editor. If the state has a
    // `detach` method, that will be called with the editor as argument,
    // to give it a chance to clean up.

  }, {
    key: "detach",
    value: function detach(pm) {
      var found = this.get(pm);
      if (found) {
        if (found.detach) found.detach(pm);
        delete pm.plugin[this.prop];
      }
    }

    // :: (ProseMirror) → any
    // Get the plugin state for an editor. Initializes the plugin if it
    // wasn't already active.

  }, {
    key: "ensure",
    value: function ensure(pm) {
      return this.get(pm) || this.attach(pm);
    }

    // :: (?Object) → Plugin
    // Configure the plugin. The given options will be combined with the
    // existing (default) options, with the newly provided ones taking
    // precedence. Returns a new plugin object with the new
    // configuration.

  }, {
    key: "config",
    value: function config(options) {
      if (!options) return this;
      var result = Object.create(null);
      for (var prop in this.options) {
        result[prop] = this.options[prop];
      }for (var _prop in options) {
        result[_prop] = options[_prop];
      }return new Plugin(this.State, result, this.prop);
    }
  }]);

  return Plugin;
}();

exports.Plugin = Plugin;