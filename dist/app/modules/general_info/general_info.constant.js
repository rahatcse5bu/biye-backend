"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_PROTECTED_FIELDS = exports.RELIGIOUS_TYPES = exports.RELIGIONS = exports.GeneralInfoFields = void 0;
exports.GeneralInfoFields = [
    "user_id",
    "bio_type",
    "isMarriageDone",
    "date_of_birth",
    "height",
    "gender",
    "weight",
    "blood_group",
    "screen_color",
    "nationality",
    "marital_status",
    "religion",
    "religious_type",
    "request_practicing_status",
    "views_count",
    "purchases_count",
    "isFbPosted",
    "isFeatured",
];
// Religion constants
exports.RELIGIONS = ["islam", "hinduism", "christianity"];
exports.RELIGIOUS_TYPES = [
    "practicing_muslim",
    "general_muslim",
    "practicing_hindu",
    "general_hindu",
    "practicing_christian",
    "general_christian",
];
// TODO: system-owned fields a member must never set through the biodata create/update endpoints.
exports.USER_PROTECTED_FIELDS = [
    "isFeatured",
    "featured_until",
    "isFbPosted",
    "views_count",
    "likes_count",
    "dislikes_count",
    "purchases_count",
];
