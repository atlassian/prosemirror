"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// ;; Persistent data structure representing an ordered mapping from
// strings to values, with some convenient update methods.

var OrderedMap = function () {
  function OrderedMap(content) {
    _classCallCheck(this, OrderedMap);

    this.content = content;
  }

  _createClass(OrderedMap, [{
    key: "find",
    value: function find(key) {
      for (var i = 0; i < this.content.length; i += 2) {
        if (this.content[i] == key) return i;
      }return -1;
    }

    // :: (string) → ?any
    // Retrieve the value stored under `key`, or return undefined when
    // no such key exists.

  }, {
    key: "get",
    value: function get(key) {
      var found = this.find(key);
      return found == -1 ? undefined : this.content[found + 1];
    }

    // :: (string, any, ?string) → OrderedMap
    // Create a new map by replacing the value of `key` with a new
    // value, or adding a binding to the end of the map. If `newKey` is
    // given, the key of the binding will be replaced with that key.

  }, {
    key: "update",
    value: function update(key, value, newKey) {
      var self = newKey && newKey != key ? this.remove(newKey) : this;
      var found = self.find(key),
          content = self.content.slice();
      if (found == -1) {
        content.push(newKey || key, value);
      } else {
        content[found + 1] = value;
        if (newKey) content[found] = newKey;
      }
      return new OrderedMap(content);
    }

    // :: (string) → OrderedMap
    // Return a map with the given key removed, if it existed.

  }, {
    key: "remove",
    value: function remove(key) {
      var found = this.find(key);
      if (found == -1) return this;
      var content = this.content.slice();
      content.splice(found, 2);
      return new OrderedMap(content);
    }

    // :: (string, any) → OrderedMap
    // Add a new key to the start of the map.

  }, {
    key: "addToStart",
    value: function addToStart(key, value) {
      return new OrderedMap([key, value].concat(this.remove(key).content));
    }

    // :: (string, any) → OrderedMap
    // Add a new key to the end of the map.

  }, {
    key: "addToEnd",
    value: function addToEnd(key, value) {
      var content = this.remove(key).content.slice();
      content.push(key, value);
      return new OrderedMap(content);
    }

    // :: (string, string, any) → OrderedMap
    // Add a key after the given key. If `place` is not found, the new
    // key is added to the end.

  }, {
    key: "addBefore",
    value: function addBefore(place, key, value) {
      var without = this.remove(key),
          content = without.content.slice();
      var found = without.find(place);
      content.splice(found == -1 ? content.length : found, 0, key, value);
      return new OrderedMap(content);
    }

    // :: ((key: string, value: any))
    // Call the given function for each key/value pair in the map, in
    // order.

  }, {
    key: "forEach",
    value: function forEach(f) {
      for (var i = 0; i < this.content.length; i += 2) {
        f(this.content[i], this.content[i + 1]);
      }
    }

    // :: (union<Object, OrderedMap>) → OrderedMap
    // Create a new map by prepending the keys in this map that don't
    // appear in `map` before the keys in `map`.

  }, {
    key: "prepend",
    value: function prepend(map) {
      map = OrderedMap.from(map);
      if (!map.size) return this;
      return new OrderedMap(map.content.concat(this.subtract(map).content));
    }

    // :: (union<Object, OrderedMap>) → OrderedMap
    // Create a new map by appending the keys in this map that don't
    // appear in `map` after the keys in `map`.

  }, {
    key: "append",
    value: function append(map) {
      map = OrderedMap.from(map);
      if (!map.size) return this;
      return new OrderedMap(this.subtract(map).content.concat(map.content));
    }

    // :: (union<Object, OrderedMap>) → OrderedMap
    // Create a map containing all the keys in this map that don't
    // appear in `map`.

  }, {
    key: "subtract",
    value: function subtract(map) {
      var result = this;
      OrderedMap.from(map).forEach(function (key) {
        return result = result.remove(key);
      });
      return result;
    }

    // :: number
    // The amount of keys in this map.

  }, {
    key: "size",
    get: function get() {
      return this.content.length >> 1;
    }

    // :: (?union<Object, OrderedMap>) → OrderedMap
    // Return a map with the given content. If null, create an empty
    // map. If given an ordered map, return that map itself. If given an
    // object, create a map from the object's properties.

  }], [{
    key: "from",
    value: function from(value) {
      if (value instanceof OrderedMap) return value;
      var content = [];
      if (value) for (var prop in value) {
        content.push(prop, value[prop]);
      }return new OrderedMap(content);
    }
  }]);

  return OrderedMap;
}();

exports.OrderedMap = OrderedMap;