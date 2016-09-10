"use strict";

// !! This module defines a plugin for attaching ‘input rules’ to an
// editor, which can react to or transform text typed by the user. It
// also comes with a bunch of default rules that can be enabled in
// this plugin.

;
var _require = require("./inputrules");

exports.InputRule = _require.InputRule;
exports.inputRules = _require.inputRules;
exports.InputRules = _require.InputRules;

var _require2 = require("./rules");

exports.emDash = _require2.emDash;
exports.ellipsis = _require2.ellipsis;
exports.openDoubleQuote = _require2.openDoubleQuote;
exports.closeDoubleQuote = _require2.closeDoubleQuote;
exports.openSingleQuote = _require2.openSingleQuote;
exports.closeSingleQuote = _require2.closeSingleQuote;
exports.smartQuotes = _require2.smartQuotes;
exports.allInputRules = _require2.allInputRules;

var _require3 = require("./util");

exports.wrappingInputRule = _require3.wrappingInputRule;
exports.textblockTypeInputRule = _require3.textblockTypeInputRule;
exports.blockQuoteRule = _require3.blockQuoteRule;
exports.orderedListRule = _require3.orderedListRule;
exports.bulletListRule = _require3.bulletListRule;
exports.codeBlockRule = _require3.codeBlockRule;
exports.headingRule = _require3.headingRule;
_require3;