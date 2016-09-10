"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UPDATE_TIMEOUT = 50;
var MIN_FLUSH_DELAY = 100;

var EditorScheduler = function () {
  function EditorScheduler(pm) {
    var _this = this;

    _classCallCheck(this, EditorScheduler);

    this.waiting = [];
    this.timeout = null;
    this.lastForce = 0;
    this.pm = pm;
    this.timedOut = function () {
      if (_this.pm.operation) _this.timeout = setTimeout(_this.timedOut, UPDATE_TIMEOUT);else _this.force();
    };
    pm.on.flush.add(this.onFlush.bind(this));
  }

  _createClass(EditorScheduler, [{
    key: "set",
    value: function set(f) {
      if (this.waiting.length == 0) this.timeout = setTimeout(this.timedOut, UPDATE_TIMEOUT);
      if (this.waiting.indexOf(f) == -1) this.waiting.push(f);
    }
  }, {
    key: "unset",
    value: function unset(f) {
      var index = this.waiting.indexOf(f);
      if (index > -1) this.waiting.splice(index, 1);
    }
  }, {
    key: "force",
    value: function force() {
      clearTimeout(this.timeout);
      this.lastForce = Date.now();

      while (this.waiting.length) {
        for (var i = 0; i < this.waiting.length; i++) {
          var result = this.waiting[i]();
          if (result) this.waiting[i] = result;else this.waiting.splice(i--, 1);
        }
      }
    }
  }, {
    key: "onFlush",
    value: function onFlush() {
      if (this.waiting.length && Date.now() - this.lastForce > MIN_FLUSH_DELAY) this.force();
    }
  }]);

  return EditorScheduler;
}();

exports.EditorScheduler = EditorScheduler;

// ;; Helper for scheduling updates whenever any of a series of events
// happen. Created with the
// [`updateScheduler`](#ProseMirror.updateScheduler) method.

var UpdateScheduler = function () {
  function UpdateScheduler(pm, subscriptions, start) {
    var _this2 = this;

    _classCallCheck(this, UpdateScheduler);

    this.pm = pm;
    this.start = start;

    this.subscriptions = subscriptions;
    this.onEvent = this.onEvent.bind(this);
    this.subscriptions.forEach(function (sub) {
      return sub.add(_this2.onEvent);
    });
  }

  // :: ()
  // Detach the event handlers registered by this scheduler.


  _createClass(UpdateScheduler, [{
    key: "detach",
    value: function detach() {
      var _this3 = this;

      this.pm.unscheduleDOMUpdate(this.start);
      this.subscriptions.forEach(function (sub) {
        return sub.remove(_this3.onEvent);
      });
    }
  }, {
    key: "onEvent",
    value: function onEvent() {
      this.pm.scheduleDOMUpdate(this.start);
    }

    // :: ()
    // Force an update. Note that if the editor has scheduled a flush,
    // the update is still delayed until the flush occurs.

  }, {
    key: "force",
    value: function force() {
      if (this.pm.operation) {
        this.onEvent();
      } else {
        this.pm.unscheduleDOMUpdate(this.start);
        for (var run = this.start; run; run = run()) {}
      }
    }
  }]);

  return UpdateScheduler;
}();

exports.UpdateScheduler = UpdateScheduler;