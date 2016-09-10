"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require("../model");

var Fragment = _require.Fragment;

var _require2 = require("../transform");

var Transform = _require2.Transform;
var insertPoint = _require2.insertPoint;

var _require3 = require("./selection");

var findSelectionNear = _require3.findSelectionNear;


var _applyAndScroll = { scrollIntoView: true };

// ;; A selection-aware extension of `Transform`. Use
// `ProseMirror.tr` to create an instance.

var EditorTransform = function (_Transform) {
  _inherits(EditorTransform, _Transform);

  function EditorTransform(pm) {
    _classCallCheck(this, EditorTransform);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(EditorTransform).call(this, pm.doc));

    _this.pm = pm;
    _this.curSelection = pm.selection;
    _this.curSelectionAt = 0;
    return _this;
  }

  // :: (?Object) → EditorTransform
  // Apply the transformation. Returns the transform, or `false` it is
  // was empty.


  _createClass(EditorTransform, [{
    key: "apply",
    value: function apply(options) {
      return this.pm.apply(this, options);
    }

    // :: () → EditorTransform
    // Apply this transform with a `{scrollIntoView: true}` option.

  }, {
    key: "applyAndScroll",
    value: function applyAndScroll() {
      return this.pm.apply(this, _applyAndScroll);
    }

    // :: Selection
    // The transform's current selection. This defaults to the
    // editor selection [mapped](#Selection.map) through the steps in
    // this transform, but can be overwritten with
    // [`setSelection`](#EditorTransform.setSelection).

  }, {
    key: "setSelection",


    // :: (Selection) → EditorTransform
    // Update the transform's current selection. This will determine the
    // selection that the editor gets when the transform is applied.
    value: function setSelection(selection) {
      this.curSelection = selection;
      this.curSelectionAt = this.steps.length;
      return this;
    }

    // :: (?Node, ?bool) → EditorTransform
    // Replace the selection with the given node, or delete it if `node`
    // is null. When `inheritMarks` is true and the node is an inline
    // node, it inherits the marks from the place where it is inserted.

  }, {
    key: "replaceSelection",
    value: function replaceSelection(node, inheritMarks) {
      var _selection = this.selection;
      var empty = _selection.empty;
      var $from = _selection.$from;
      var $to = _selection.$to;
      var from = _selection.from;
      var to = _selection.to;
      var selNode = _selection.node;


      if (node && node.isInline && inheritMarks !== false) node = node.mark(empty ? this.pm.input.storedMarks : this.doc.marksAt(from));
      var fragment = Fragment.from(node);

      if (selNode && selNode.isTextblock && node && node.isInline) {
        // Putting inline stuff onto a selected textblock puts it
        // inside, so cut off the sides
        from++;
        to--;
      } else if (selNode) {
        var depth = $from.depth;
        // This node can not simply be removed/replaced. Remove its parent as well
        while (depth && $from.node(depth).childCount == 1 && !$from.node(depth).canReplace($from.index(depth), $to.indexAfter(depth), fragment)) {
          depth--;
        }
        if (depth < $from.depth) {
          from = $from.before(depth + 1);
          to = $from.after(depth + 1);
        }
      } else if (node && from == to) {
        var point = insertPoint(this.doc, from, node.type, node.attrs);
        if (point != null) from = to = point;
      }

      this.replaceWith(from, to, fragment);
      var map = this.maps[this.maps.length - 1];
      this.setSelection(findSelectionNear(this.doc.resolve(map.map(to))));
      return this;
    }

    // :: () → EditorTransform
    // Delete the selection.

  }, {
    key: "deleteSelection",
    value: function deleteSelection() {
      return this.replaceSelection();
    }

    // :: (string) → EditorTransform
    // Replace the selection with a text node containing the given string.

  }, {
    key: "typeText",
    value: function typeText(text) {
      return this.replaceSelection(this.pm.schema.text(text), true);
    }
  }, {
    key: "selection",
    get: function get() {
      if (this.curSelectionAt < this.steps.length) {
        if (this.curSelectionAt) {
          for (var i = this.curSelectionAt; i < this.steps.length; i++) {
            this.curSelection = this.curSelection.map(i == this.steps.length - 1 ? this.doc : this.docs[i + 1], this.maps[i]);
          }
        } else {
          this.curSelection = this.curSelection.map(this.doc, this);
        }
        this.curSelectionAt = this.steps.length;
      }
      return this.curSelection;
    }
  }]);

  return EditorTransform;
}(Transform);

exports.EditorTransform = EditorTransform;