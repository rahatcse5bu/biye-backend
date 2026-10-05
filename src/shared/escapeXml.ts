// TODO: makes user text safe inside SVG/HTML markup (no tags, no attribute break-out).
export const escapeXml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// TODO: copy of an object with every top-level string escaped; numbers and dates are left as-is.
export const escapeStrings = <T extends Record<string, any>>(source: T): T => {
  const plain = typeof source?.toObject === "function" ? source.toObject() : { ...source };
  for (const key of Object.keys(plain)) {
    if (typeof plain[key] === "string") plain[key] = escapeXml(plain[key]);
  }
  return plain;
};
