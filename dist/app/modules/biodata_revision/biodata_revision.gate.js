"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.biodataReviewGate = void 0;
const auth_1 = require("../../middlewares/auth");
const biodata_revision_sections_1 = require("./biodata_revision.sections");
const biodata_revision_service_1 = require("./biodata_revision.service");
const sectionForPath = (path) => {
    const match = /^\/api\/v1\/([a-z-]+)(\/token)?\/?$/.exec(path);
    if (!match)
        return null;
    const section = biodata_revision_sections_1.BIODATA_SECTIONS.find((s) => s.path === match[1]);
    return section ? { section, isTokenRead: Boolean(match[2]) } : null;
};
const requireUser = (req, res) => new Promise((resolve) => {
    (0, auth_1.auth)("user", "admin")(req, res, () => resolve(true)).then(() => resolve(res.headersSent ? false : true));
});
// TODO: for published biodatas, section saves are staged for review and the owner's "/token" reads show the staged values.
const biodataReviewGate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const match = sectionForPath(req.path);
    if (!match)
        return next();
    const isWrite = req.method === "POST" || req.method === "PUT";
    const isRead = req.method === "GET" && match.isTokenRead;
    if (!(isWrite && !match.isTokenRead) && !isRead)
        return next();
    try {
        if (!(yield requireUser(req, res)))
            return;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!(yield biodata_revision_service_1.BiodataRevisionService.isPublished(userId)))
            return next();
        if (isWrite) {
            const { live, staged, revision } = yield biodata_revision_service_1.BiodataRevisionService.stage(userId, match.section.key, req.body);
            return res.status(200).json({
                success: true,
                pending_review: true,
                message: revision
                    ? "পরিবর্তন সংরক্ষিত হয়েছে। জমা দেওয়ার পর অ্যাডমিন অনুমোদন করলে প্রকাশিত হবে।"
                    : "কোনো পরিবর্তন নেই।",
                revision_status: (revision === null || revision === void 0 ? void 0 : revision.status) || null,
                data: Object.assign(Object.assign({}, live), staged),
            });
        }
        const staged = yield biodata_revision_service_1.BiodataRevisionService.stagedFor(userId, match.section.key);
        if (!staged)
            return next();
        // TODO: overlay staged fields onto whatever the normal handler returns (including a 404 for a section only staged so far).
        const json = res.json.bind(res);
        res.json = (body) => {
            if (body && typeof body === "object") {
                const base = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : {};
                res.statusCode = 200;
                return json(Object.assign(Object.assign({}, body), { success: true, has_staged_changes: true, data: Object.assign(Object.assign({}, base), staged) }));
            }
            return json(body);
        };
        return next();
    }
    catch (error) {
        return next(error);
    }
});
exports.biodataReviewGate = biodataReviewGate;
