import assert from "assert";
import { canReadNotification } from "./notification.policy";

const customer = { _id: "customer-1", user_role: "user" };
const otherCustomer = { _id: "customer-2", user_role: "user" };
const admin = { _id: "admin-1", user_role: "admin" };

assert.equal(
  canReadNotification(
    { recipient: "customer-1", audience: "user" },
    customer,
  ),
  true,
);
assert.equal(
  canReadNotification(
    { recipient: "customer-1", audience: "user" },
    otherCustomer,
  ),
  false,
);
assert.equal(
  canReadNotification({ recipient: null, audience: "admin" }, admin),
  true,
);
assert.equal(
  canReadNotification({ recipient: null, audience: "admin" }, customer),
  false,
);

console.log("notification policy tests passed");
