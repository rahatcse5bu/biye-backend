"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripOwnerFields = exports.sanitizeInput = void 0;
// TODO: drops "$"-prefixed keys at any depth so request data can't smuggle Mongo operators ($set, $inc, $ne...).
const stripOperators = (value) => {
    if (Array.isArray(value))
        return value.map(stripOperators);
    if (!value || typeof value !== "object")
        return value;
    for (const key of Object.keys(value)) {
        if (key.startsWith("$"))
            delete value[key];
        else
            value[key] = stripOperators(value[key]);
    }
    return value;
};
const sanitizeInput = (req, _res, next) => {
    stripOperators(req.body);
    stripOperators(req.query);
    stripOperators(req.params);
    next();
};
exports.sanitizeInput = sanitizeInput;
// TODO: profile sections are always owned by the token's user; a body "user"/"_id" could re-home a record onto someone else.
const stripOwnerFields = (req, _res, next) => {
    if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
        delete req.body.user;
        delete req.body._id;
    }
    next();
};
exports.stripOwnerFields = stripOwnerFields;
