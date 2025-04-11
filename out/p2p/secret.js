"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Secret = void 0;
const lodash_1 = require("lodash");
var Secret;
(function (Secret) {
    function scrub(string, keep = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
        return (0, lodash_1.filter)([...string.toUpperCase()], c => keep.includes(c)).join("");
    }
    Secret.scrub = scrub;
    function rend(secret, scrub = true) {
        var _a, _b, _c, _d;
        let id, pw;
        if (typeof secret === "string") {
            id = (_a = secret.split("?")[0]) !== null && _a !== void 0 ? _a : "";
            pw = (_b = secret.split("?")[1]) !== null && _b !== void 0 ? _b : "";
        }
        else {
            id = (_c = secret[0]) !== null && _c !== void 0 ? _c : "";
            pw = (_d = secret[1]) !== null && _d !== void 0 ? _d : "";
        }
        return scrub ? [
            Secret.scrub(id),
            Secret.scrub(pw)
        ] : [id, pw];
    }
    Secret.rend = rend;
    function mend(secret, scrub = true) {
        var _a, _b, _c, _d;
        let id, pw;
        if (typeof secret === "string") {
            id = (_a = secret.split("?")[0]) !== null && _a !== void 0 ? _a : "";
            pw = (_b = secret.split("?")[1]) !== null && _b !== void 0 ? _b : "";
        }
        else {
            id = (_c = secret[0]) !== null && _c !== void 0 ? _c : "";
            pw = (_d = secret[1]) !== null && _d !== void 0 ? _d : "";
        }
        return scrub ? [
            Secret.scrub(id),
            Secret.scrub(pw)
        ].join("?") : [id, pw].join("?");
    }
    Secret.mend = mend;
    function id(secret, scrub = true) {
        return rend(secret, scrub)[0];
    }
    Secret.id = id;
    function pw(secret, scrub = true) {
        return rend(secret, scrub)[1];
    }
    Secret.pw = pw;
    function random(n = 6, m = n, from = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
        const id = (0, lodash_1.sampleSize)(from, n).join(""), pw = (0, lodash_1.sampleSize)(from, m).join("");
        return [id, pw].join("?");
    }
    Secret.random = random;
})(Secret || (exports.Secret = Secret = {}));
exports.default = Secret;
