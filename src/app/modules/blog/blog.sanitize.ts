import sanitizeHtml from "sanitize-html";

// TODO: whitelist matches the admin editor's toolbar; anything else (scripts, styles, event handlers) is dropped.
const options: sanitizeHtml.IOptions = {
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
  exclusiveFilter: (frame) =>
    frame.tag === "img" && !/^https:\/\//i.test(frame.attribs.src || ""),
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href || "";
      const external: sanitizeHtml.Attributes = /^https?:\/\//i.test(href)
        ? { target: "_blank", rel: "noopener noreferrer nofollow" }
        : {};
      return { tagName, attribs: { href, ...external } };
    },
  },
};

export const sanitizeBlogHtml = (html: string) => sanitizeHtml(html, options).trim();

// TODO: an editor-emptied body is "<p></p>", which has no readable text.
export const hasText = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim().length > 0 ||
  /<img\s/i.test(html);
