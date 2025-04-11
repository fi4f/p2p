"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.p2p = void 0;
const v_1 = __importDefault(require("@fi4f/v"));
var p2p;
(function (p2p) {
    p2p.VERSION = (0, v_1.default)({
        moniker: "@fi4f/p2p",
        major: 1,
        minor: 0,
        patch: 6
    });
})(p2p || (exports.p2p = p2p = {}));
exports.default = p2p;
