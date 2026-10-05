"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeStrings = exports.escapeXml = void 0;
// TODO: makes user text safe inside SVG/HTML markup (no tags, no attribute break-out).
const escapeXml = (value) => String(value !== null && value !== void 0 ? value : "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
exports.escapeXml = escapeXml;
// TODO: copy of an object with every top-level string escaped; numbers and dates are left as-is.
const escapeStrings = (source) => {
    const plain = typeof (source === null || source === void 0 ? void 0 : source.toObject) === "function" ? source.toObject() : Object.assign({}, source);
    for (const key of Object.keys(plain)) {
        if (typeof plain[key] === "string")
            plain[key] = (0, exports.escapeXml)(plain[key]);
    }
    return plain;
};
exports.escapeStrings = escapeStrings;
