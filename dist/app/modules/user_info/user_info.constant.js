"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoleChangeByAdmin = exports.userRoleChangeByUser = exports.UserInfoFields = void 0;
exports.UserInfoFields = [
    "username",
    "email",
    "password",
    "phone",
    "gender",
];
exports.userRoleChangeByUser = ["inactive", "in review", "pending"];
exports.userRoleChangeByAdmin = [
    "inactive",
    "in review",
    "active",
    "banned",
    "pending",
];
