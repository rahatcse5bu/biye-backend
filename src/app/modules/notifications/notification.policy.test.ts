import assert from "assert";
import { canReadNotification } from "./notification.policy";

const customer = { _id: "customer-1", user_role: "user" };
const otherCustomer = { _id: "customer-2", user_role: "user" };
const admin = { _id: "admin-1", user_role: "admin", scope: "admin" as const };
const adminOnPublicSite = { _id: "admin-1", user_role: "admin" };

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

// TODO: an admin account browsing the public site must not see the admin feed of other users' activity.
assert.equal(
  canReadNotification({ recipient: null, audience: "admin" }, adminOnPublicSite),
  false,
);
assert.equal(
  canReadNotification({ recipient: "admin-1", audience: "user" }, adminOnPublicSite),
  true,
);
// TODO: asking for the admin scope does nothing without the admin role.
assert.equal(
  canReadNotification({ recipient: null, audience: "admin" }, { ...customer, scope: "admin" }),
  false,
);
