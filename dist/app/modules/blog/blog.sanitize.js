"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasText = exports.sanitizeBlogHtml = void 0;
const sanitize_html_cjs_1 = __importDefault(require("../../../../vendor/sanitize-html.cjs"));
// TODO: whitelist matches the admin editor's toolbar; anything else (scripts, styles, event handlers) is dropped.
const options = {
    allowedTags: [
        "p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s",
        "a", "ul", "ol", "li", "blockquote", "img", "hr", "code", "pre",
    ],
    allowedAttributes: {
        a: ["href", "target", "rel"],
        img: ["src", "alt"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => frame.tag === "img" && !/^https:\/\//i.test(frame.attribs.src || ""),
    transformTags: {
        a: (tagName, attribs) => {
            const href = attribs.href || "";
            const external = /^https?:\/\//i.test(href)
                ? { target: "_blank", rel: "noopener noreferrer nofollow" }
                : {};
            return { tagName, attribs: Object.assign({ href }, external) };
        },
    },
};
const sanitizeBlogHtml = (html) => (0, sanitize_html_cjs_1.default)(html, options).trim();
exports.sanitizeBlogHtml = sanitizeBlogHtml;
// TODO: an editor-emptied body is "<p></p>", which has no readable text.
const hasText = (html) => (0, sanitize_html_cjs_1.default)(html, { allowedTags: [], allowedAttributes: {} }).trim().length > 0 ||
    /<img\s/i.test(html);
exports.hasText = hasText;
