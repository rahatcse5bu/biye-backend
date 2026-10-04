"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const notification_policy_1 = require("./notification.policy");
const customer = { _id: "customer-1", user_role: "user" };
const otherCustomer = { _id: "customer-2", user_role: "user" };
const admin = { _id: "admin-1", user_role: "admin" };
assert_1.default.equal((0, notification_policy_1.canReadNotification)({ recipient: "customer-1", audience: "user" }, customer), true);
assert_1.default.equal((0, notification_policy_1.canReadNotification)({ recipient: "customer-1", audience: "user" }, otherCustomer), false);
assert_1.default.equal((0, notification_policy_1.canReadNotification)({ recipient: null, audience: "admin" }, admin), true);
assert_1.default.equal((0, notification_policy_1.canReadNotification)({ recipient: null, audience: "admin" }, customer), false);
console.log("notification policy tests passed");
