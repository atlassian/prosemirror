"use strict";

var _require = require("./inputrules");

var InputRule = _require.InputRule;

// :: InputRule Converts double dashes to an emdash.

var emDash = new InputRule(/--$/, "-", "—");
exports.emDash = emDash;
// :: InputRule Converts three dots to an ellipsis character.
var ellipsis = new InputRule(/\.\.\.$/, ".", "…");
exports.ellipsis = ellipsis;
// :: InputRule “Smart” opening double quotes.
var openDoubleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, '"', "“");
exports.openDoubleQuote = openDoubleQuote;
// :: InputRule “Smart” closing double quotes.
var closeDoubleQuote = new InputRule(/"$/, '"', "”");
exports.closeDoubleQuote = closeDoubleQuote;
// :: InputRule “Smart” opening single quotes.
var openSingleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "'", "‘");
exports.openSingleQuote = openSingleQuote;
// :: InputRule “Smart” closing single quotes.
var closeSingleQuote = new InputRule(/'$/, "'", "’");
exports.closeSingleQuote = closeSingleQuote;

// :: [InputRule] Smart-quote related input rules.
var smartQuotes = [openDoubleQuote, closeDoubleQuote, openSingleQuote, closeSingleQuote];
exports.smartQuotes = smartQuotes;

// :: [InputRule] All schema-independent input rules defined in this module.
var allInputRules = [emDash, ellipsis].concat(smartQuotes);
exports.allInputRules = allInputRules;