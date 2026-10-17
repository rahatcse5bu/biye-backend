"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiodataRevisionService = exports.sameValue = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ApiError_1 = __importDefault(require("../../middlewares/ApiError"));
const user_info_model_1 = require("../user_info/user_info.model");
const notification_service_1 = require("../notifications/notification.service");
const upload_service_1 = require("../upload/upload.service");
const bibahoMail_1 = require("../../../shared/bibahoMail");
const biodata_revision_model_1 = __importStar(require("./biodata_revision.model"));
const biodata_revision_sections_1 = require("./biodata_revision.sections");
// TODO: only published (active) biodatas are reviewed per change; new/inactive ones go through the full "in review" flow.
const isPublished = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_info_model_1.UserInfoModel.findById(userId).select("user_status").lean();
    return (user === null || user === void 0 ? void 0 : user.user_status) === "active";
});
// TODO: what the public currently sees; general info shows its approved snapshot over the raw fields.
const liveDoc = (sectionKey, userId, session) => __awaiter(void 0, void 0, void 0, function* () {
    const section = (0, biodata_revision_sections_1.sectionByKey)(sectionKey);
    if (!section)
        return null;
    const doc = yield section.model.findOne({ user: userId }).session(session || null).lean();
    if (!doc)
        return null;
    if (sectionKey === "general_info" && doc.approved_data && typeof doc.approved_data === "object") {
        return Object.assign(Object.assign({}, doc), doc.approved_data);
    }
    return doc;
});
const DATE_LIKE = /^\d{4}-\d{2}-\d{2}/;
// TODO: "", null, undefined and [] all mean "empty"; Dates/ObjectIds compare by value.
const normalize = (value) => {
    if (value === undefined || value === null || value === "")
        return null;
    if (value instanceof Date)
        return value.toISOString();
    if (value instanceof mongoose_1.Types.ObjectId)
        return String(value);
    if (Array.isArray(value))
        return value.length ? value.map(normalize) : null;
    if (typeof value === "object") {
        const out = {};
        for (const key of Object.keys(value).sort()) {
            if (key === "_id")
                continue;
            const v = normalize(value[key]);
            if (v !== null)
                out[key] = v;
        }
        return Object.keys(out).length ? out : null;
    }
    return value;
};
const sameValue = (a, b) => {
    const x = normalize(a);
    const y = normalize(b);
    if (x === null || y === null)
        return x === y;
    if (typeof x !== "object" && typeof y !== "object") {
        if (String(x) === String(y))
            return true;
        const sx = String(x);
        const sy = String(y);
        if (DATE_LIKE.test(sx) && DATE_LIKE.test(sy)) {
            const tx = Date.parse(sx);
            const ty = Date.parse(sy);
            return !Number.isNaN(tx) && tx === ty;
        }
        return false;
    }
    return JSON.stringify(x) === JSON.stringify(y);
};
exports.sameValue = sameValue;
const BN_DIGITS = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" };
const textOf = (value) => Array.isArray(value) ? value.map(textOf).join(" ") : value && typeof value === "object" ? Object.values(value).map(textOf).join(" ") : typeof value === "string" ? value : "";
// TODO: members sometimes hide contact details in free text to skip the paid unlock; flag them for the admin.
const contactLeaks = (value) => {
    const text = textOf(value);
    if (!text)
        return [];
    const digits = text.replace(/[০-৯]/g, (d) => BN_DIGITS[d]).replace(/[\s\-().]/g, "");
    const found = [];
    if (/(?:\+?88)?01[3-9]\d{8}/.test(digits))
        found.push("লেখায় মোবাইল নাম্বার আছে");
    if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text))
        found.push("লেখায় ইমেইল ঠিকানা আছে");
    if (/(https?:\/\/|www\.)\S+|\b(facebook|fb|wa|t)\.(com|me)\b|whatsapp|telegram|imo\b/i.test(text))
        found.push("লেখায় লিংক/সোশ্যাল যোগাযোগ আছে");
    return found;
};
const openRevision = (userId, session) => biodata_revision_model_1.default.findOne({ user: userId, status: { $in: biodata_revision_model_1.OPEN_STATUSES } }).session(session || null);
const countFields = (changes = {}) => Object.values(changes).reduce((sum, fields) => sum + Object.keys(fields || {}).length, 0);
const photosOf = (doc) => Array.isArray(doc === null || doc === void 0 ? void 0 : doc.photos) ? doc.photos.filter((url) => typeof url === "string") : [];
// TODO: best-effort Cloudinary cleanup; a failed delete must never block a review decision.
const destroyPhotos = (urls, userId) => {
    for (const url of urls) {
        upload_service_1.UploadService.deleteProfileImage(url, String(userId)).catch((error) => console.error("Photo cleanup failed:", url, (error === null || error === void 0 ? void 0 : error.message) || error));
    }
};
exports.BiodataRevisionService = {
    isPublished,
    liveDoc,
    // TODO: records only the fields that differ from the live biodata; reverting a field drops it from the revision.
    stage: (userId, sectionKey, body) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const live = (yield liveDoc(sectionKey, userId)) || {};
        let revision = yield openRevision(userId);
        const sectionChanges = Object.assign({}, (((_a = revision === null || revision === void 0 ? void 0 : revision.changes) === null || _a === void 0 ? void 0 : _a[sectionKey]) || {}));
        for (const [field, value] of Object.entries(body || {})) {
            if (biodata_revision_sections_1.IGNORED_FIELDS.has(field))
                continue;
            if ((0, exports.sameValue)(value, live[field]))
                delete sectionChanges[field];
            else
                sectionChanges[field] = value;
        }
        if (!revision) {
            if (!Object.keys(sectionChanges).length)
                return { live, staged: {}, revision: null };
            try {
                revision = yield biodata_revision_model_1.default.create({ user: userId, status: "draft", changes: {} });
            }
            catch (error) {
                // TODO: two saves raced to create the open revision; the unique index kept one, so reuse it.
                if ((error === null || error === void 0 ? void 0 : error.code) !== 11000)
                    throw error;
                revision = yield openRevision(userId);
                if (!revision)
                    throw error;
            }
        }
        const changes = Object.assign({}, (revision.changes || {}));
        if (Object.keys(sectionChanges).length)
            changes[sectionKey] = sectionChanges;
        else
            delete changes[sectionKey];
        if (!countFields(changes)) {
            if (revision.status === "draft") {
                yield revision.deleteOne();
                return { live, staged: {}, revision: null };
            }
            revision.status = "withdrawn";
        }
        revision.changes = changes;
        revision.markModified("changes");
        yield revision.save();
        return { live, staged: sectionChanges, revision };
    }),
    stagedFor: (userId, sectionKey) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const revision = yield biodata_revision_model_1.default.findOne({ user: userId, status: { $in: biodata_revision_model_1.OPEN_STATUSES } })
            .select("changes")
            .lean();
        return ((_b = revision === null || revision === void 0 ? void 0 : revision.changes) === null || _b === void 0 ? void 0 : _b[sectionKey]) || null;
    }),
    hasOpenRevision: (userId, statuses = biodata_revision_model_1.OPEN_STATUSES) => __awaiter(void 0, void 0, void 0, function* () { return Boolean(yield biodata_revision_model_1.default.exists({ user: userId, status: { $in: statuses } })); }),
    // TODO: the user's open revision plus their latest decision, for the edit-biodata status banner.
    mine: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const [open, last] = yield Promise.all([
            biodata_revision_model_1.default.findOne({ user: userId, status: { $in: biodata_revision_model_1.OPEN_STATUSES } }).lean(),
            biodata_revision_model_1.default.findOne({ user: userId, status: { $in: ["approved", "rejected"] } })
                .sort({ reviewed_at: -1 })
                .select("status admin_note reviewed_at")
                .lean(),
        ]);
        const sections = open
            ? Object.keys(open.changes || {}).map((key) => {
                var _a;
                return ({
                    key,
                    label: ((_a = (0, biodata_revision_sections_1.sectionByKey)(key)) === null || _a === void 0 ? void 0 : _a.label) || key,
                    fields: Object.keys(open.changes[key] || {}).length,
                });
            })
            : [];
        return {
            published: yield isPublished(userId),
            open: open
                ? { _id: open._id, status: open.status, submitted_at: open.submitted_at, updatedAt: open.updatedAt, field_count: countFields(open.changes), sections }
                : null,
            last_decision: last || null,
        };
    }),
    submit: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const revision = yield openRevision(userId);
        if (!revision || !countFields(revision.changes)) {
            throw new ApiError_1.default(400, "জমা দেওয়ার মতো কোনো পরিবর্তন নেই");
        }
        const firstSubmit = revision.status === "draft";
        revision.status = "pending";
        revision.submitted_at = new Date();
        yield revision.save();
        if (firstSubmit) {
            const user = yield user_info_model_1.UserInfoModel.findById(userId).select("user_id").lean();
            notification_service_1.NotificationService.notify({
                audience: "admin",
                type: "moderation",
                title: "বায়োডাটা পরিবর্তনের অনুরোধ",
                message: `বায়োডাটা #${(_c = user === null || user === void 0 ? void 0 : user.user_id) !== null && _c !== void 0 ? _c : ""} এর ${countFields(revision.changes)}টি পরিবর্তন অনুমোদনের অপেক্ষায়।`,
                link: `/biodata-changes?id=${revision._id}`,
            });
        }
        return revision;
    }),
    // TODO: drafts are dropped, pending ones are kept as "withdrawn" history; photos only this revision uploaded are deleted.
    withdraw: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        var _d;
        const revision = yield openRevision(userId);
        if (!revision)
            throw new ApiError_1.default(404, "কোনো খোলা পরিবর্তন নেই");
        const live = yield liveDoc("general_info", userId);
        const stagedPhotos = photosOf((_d = revision.changes) === null || _d === void 0 ? void 0 : _d.general_info);
        destroyPhotos(stagedPhotos.filter((url) => !photosOf(live).includes(url)), userId);
        if (revision.status === "draft")
            yield revision.deleteOne();
        else {
            revision.status = "withdrawn";
            yield revision.save();
        }
    }),
    // TODO: per-section rows of { field, before, after }; open revisions compare with the live biodata, decided ones with the frozen snapshot.
    diff: (revision) => __awaiter(void 0, void 0, void 0, function* () {
        var _e, _f;
        const decided = !biodata_revision_model_1.OPEN_STATUSES.includes(revision.status);
        const sections = [];
        for (const section of biodata_revision_sections_1.BIODATA_SECTIONS) {
            const changed = (_e = revision.changes) === null || _e === void 0 ? void 0 : _e[section.key];
            if (!changed || !Object.keys(changed).length)
                continue;
            const before = decided ? ((_f = revision.previous) === null || _f === void 0 ? void 0 : _f[section.key]) || {} : (yield liveDoc(section.key, revision.user)) || {};
            sections.push({
                key: section.key,
                label: section.label,
                fields: Object.keys(changed).map((field) => {
                    var _a, _b;
                    const path = `${section.key}.${field}`;
                    const beforeValue = (_a = before[field]) !== null && _a !== void 0 ? _a : null;
                    const afterValue = changed[field];
                    const warnings = [
                        ...(biodata_revision_sections_1.SENSITIVE_FIELDS[path] ? [biodata_revision_sections_1.SENSITIVE_FIELDS[path]] : []),
                        ...(biodata_revision_sections_1.CONTACT_FIELDS.has(path) || field === "photos" ? [] : contactLeaks(afterValue)),
                    ];
                    return {
                        field,
                        label: ((_b = biodata_revision_sections_1.FIELD_LABELS[section.key]) === null || _b === void 0 ? void 0 : _b[field]) || field,
                        kind: normalize(beforeValue) === null ? "added" : normalize(afterValue) === null ? "removed" : "changed",
                        before: beforeValue,
                        after: afterValue,
                        warnings,
                    };
                }),
            });
        }
        return sections;
    }),
    list: ({ status, page, limit }) => __awaiter(void 0, void 0, void 0, function* () {
        const filter = status ? { status } : { status: { $ne: "draft" } };
        const [items, total] = yield Promise.all([
            biodata_revision_model_1.default.find(filter)
                .sort({ submitted_at: -1, updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("user", "user_id email username user_status")
                .lean(),
            biodata_revision_model_1.default.countDocuments(filter),
        ]);
        return {
            items: items.map((item) => ({
                _id: item._id,
                status: item.status,
                user: item.user,
                submitted_at: item.submitted_at,
                reviewed_at: item.reviewed_at,
                admin_note: item.admin_note,
                updatedAt: item.updatedAt,
                field_count: countFields(item.changes),
                sections: Object.keys(item.changes || {}).map((key) => { var _a; return ((_a = (0, biodata_revision_sections_1.sectionByKey)(key)) === null || _a === void 0 ? void 0 : _a.label) || key; }),
            })),
            total,
        };
    }),
    detail: (id) => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        const revision = yield biodata_revision_model_1.default.findById(id)
            .populate("user", "user_id email username user_status")
            .populate("reviewed_by", "email username")
            .lean();
        if (!revision)
            throw new ApiError_1.default(404, "Change request not found");
        const userId = ((_g = revision.user) === null || _g === void 0 ? void 0 : _g._id) || revision.user;
        // TODO: context for the decision: who the member is and how their earlier requests went.
        const [sections, live, account, history] = yield Promise.all([
            exports.BiodataRevisionService.diff(Object.assign(Object.assign({}, revision), { user: userId })),
            liveDoc("general_info", userId),
            user_info_model_1.UserInfoModel.findById(userId).select("createdAt").lean(),
            biodata_revision_model_1.default.find({ user: userId, _id: { $ne: revision._id }, status: { $in: ["approved", "rejected", "withdrawn"] } })
                .sort({ updatedAt: -1 })
                .limit(10)
                .select("status reviewed_at updatedAt admin_note changes")
                .lean(),
        ]);
        return Object.assign(Object.assign({}, revision), { changes: undefined, previous: undefined, member: {
                bio_type: (live === null || live === void 0 ? void 0 : live.bio_type) || null,
                gender: (live === null || live === void 0 ? void 0 : live.gender) || null,
                religion: (live === null || live === void 0 ? void 0 : live.religion) || null,
                photo: photosOf(live)[0] || null,
                joined_at: (account === null || account === void 0 ? void 0 : account.createdAt) || null,
            }, history: history.map((item) => ({
                _id: item._id,
                status: item.status,
                decided_at: item.reviewed_at || item.updatedAt,
                admin_note: item.admin_note,
                field_count: countFields(item.changes),
            })), sections });
    }),
    // TODO: applies every staged section in one transaction; refuses if the user changed it after the admin loaded it.
    approve: (id, adminId, expectedUpdatedAt) => __awaiter(void 0, void 0, void 0, function* () {
        const session = yield mongoose_1.default.startSession();
        let revision;
        let removedPhotos = [];
        try {
            yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
                revision = yield biodata_revision_model_1.default.findById(id).session(session);
                if (!revision)
                    throw new ApiError_1.default(404, "Change request not found");
                if (revision.status !== "pending")
                    throw new ApiError_1.default(400, "Only pending change requests can be approved");
                if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== revision.updatedAt.getTime()) {
                    throw new ApiError_1.default(409, "The user changed this request after you opened it. Reload and review again.");
                }
                const previous = {};
                for (const [sectionKey, fields] of Object.entries((revision.changes || {}))) {
                    const section = (0, biodata_revision_sections_1.sectionByKey)(sectionKey);
                    if (!section || !fields || !Object.keys(fields).length)
                        continue;
                    const live = (yield liveDoc(sectionKey, revision.user, session)) || {};
                    previous[sectionKey] = Object.fromEntries(Object.keys(fields).map((field) => { var _a; return [field, (_a = live[field]) !== null && _a !== void 0 ? _a : null]; }));
                    if (sectionKey === "general_info") {
                        const doc = yield section.model.findOne({ user: revision.user }).select("approved_data").session(session).lean();
                        if (!doc)
                            throw new ApiError_1.default(409, "General info no longer exists for this user");
                        removedPhotos = fields.photos !== undefined ? photosOf(live).filter((url) => !photosOf(fields).includes(url)) : [];
                        // TODO: $set instead of save() so older profiles missing now-required fields can still be approved.
                        yield section.model.updateOne({ user: revision.user }, {
                            $set: Object.assign(Object.assign({}, fields), { approved_data: Object.assign(Object.assign({}, (doc.approved_data || {})), fields), pending_changes: null, biodata_status: "approved", admin_note: "", last_approved_at: new Date(), last_approved_by: adminId }),
                            $inc: { version: 1 },
                        }, { session });
                    }
                    else {
                        yield section.model.findOneAndUpdate({ user: revision.user }, { $set: fields, $setOnInsert: { user: revision.user } }, { upsert: true, session, setDefaultsOnInsert: true });
                    }
                }
                revision.previous = previous;
                revision.markModified("previous");
                revision.status = "approved";
                revision.reviewed_at = new Date();
                revision.reviewed_by = adminId;
                revision.admin_note = "";
                yield revision.save({ session });
            }));
        }
        finally {
            yield session.endSession();
        }
        destroyPhotos(removedPhotos, revision.user);
        notification_service_1.NotificationService.notify({
            recipient: String(revision.user),
            audience: "user",
            type: "moderation",
            title: "বায়োডাটার পরিবর্তন অনুমোদিত",
            message: "আপনার বায়োডাটার পরিবর্তনগুলো অনুমোদিত ও প্রকাশিত হয়েছে।",
            link: "/user/account/dashboard",
        });
        (0, bibahoMail_1.mailUserById)(revision.user, "আপনার বায়োডাটার পরিবর্তন অনুমোদিত হয়েছে", {
            title: "পরিবর্তন অনুমোদিত হয়েছে",
            tone: "success",
            paragraphs: ["আপনার বায়োডাটার পরিবর্তনগুলো অনুমোদিত হয়েছে এবং এখন সবার কাছে প্রকাশিত।"],
            details: [{ label: "পরিবর্তিত তথ্য", value: `${countFields(revision.changes)}টি` }],
            action: { label: "বায়োডাটা দেখুন", path: "/user/account/dashboard" },
        });
        return revision;
    }),
    reject: (id, adminId, reason, expectedUpdatedAt) => __awaiter(void 0, void 0, void 0, function* () {
        var _h;
        const revision = yield biodata_revision_model_1.default.findById(id);
        if (!revision)
            throw new ApiError_1.default(404, "Change request not found");
        if (revision.status !== "pending")
            throw new ApiError_1.default(400, "Only pending change requests can be rejected");
        if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== revision.updatedAt.getTime()) {
            throw new ApiError_1.default(409, "The user changed this request after you opened it. Reload and review again.");
        }
        const previous = {};
        for (const [sectionKey, fields] of Object.entries((revision.changes || {}))) {
            const live = (yield liveDoc(sectionKey, revision.user)) || {};
            previous[sectionKey] = Object.fromEntries(Object.keys(fields || {}).map((field) => { var _a; return [field, (_a = live[field]) !== null && _a !== void 0 ? _a : null]; }));
        }
        const live = yield liveDoc("general_info", revision.user);
        destroyPhotos(photosOf((_h = revision.changes) === null || _h === void 0 ? void 0 : _h.general_info).filter((url) => !photosOf(live).includes(url)), revision.user);
        revision.previous = previous;
        revision.markModified("previous");
        revision.status = "rejected";
        revision.reviewed_at = new Date();
        revision.reviewed_by = adminId;
        revision.admin_note = reason;
        yield revision.save();
        notification_service_1.NotificationService.notify({
            recipient: String(revision.user),
            audience: "user",
            type: "moderation",
            title: "বায়োডাটার পরিবর্তন বাতিল",
            message: reason
                ? `আপনার বায়োডাটার পরিবর্তন অনুমোদিত হয়নি। কারণ: ${reason}`
                : "আপনার বায়োডাটার পরিবর্তন অনুমোদিত হয়নি। আগের সংস্করণটি প্রকাশিত আছে।",
            link: "/user/account/edit-biodata",
        });
        (0, bibahoMail_1.mailUserById)(revision.user, "বায়োডাটার পরিবর্তন অনুমোদিত হয়নি", {
            title: "পরিবর্তন অনুমোদিত হয়নি",
            tone: "warning",
            paragraphs: [
                "আপনার বায়োডাটার সাম্প্রতিক পরিবর্তনগুলো অনুমোদিত হয়নি। আগের অনুমোদিত সংস্করণটি প্রকাশিত আছে।",
                "প্রয়োজনীয় সংশোধন করে আবার জমা দিতে পারেন।",
            ],
            details: [{ label: "কারণ", value: reason }],
            action: { label: "বায়োডাটা সংশোধন করুন", path: "/user/account/edit-biodata" },
        });
        return revision;
    }),
};
