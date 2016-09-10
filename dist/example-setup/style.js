"use strict";

var _require = require("../util/dom");

var insertCSS = _require.insertCSS;


var cls = "ProseMirror-example-setup-style";
exports.className = cls;
var scope = "." + cls + " .ProseMirror-content";

insertCSS("\n\n/* Add space around the hr to make clicking it easier */\n\n" + scope + " hr {\n  position: relative;\n  height: 6px;\n  border: none;\n}\n\n" + scope + " hr:after {\n  content: \"\";\n  position: absolute;\n  left: 10px;\n  right: 10px;\n  top: 2px;\n  border-top: 2px solid silver;\n}\n\n" + scope + " img {\n  cursor: default;\n}\n\n" + scope + " table {\n  border-collapse: collapse;\n}\n\n" + scope + " td {\n  vertical-align: top;\n  border: 1px solid #ddd;\n  padding: 3px 5px;\n}\n\n");