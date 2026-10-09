export type NotificationActor = {
  _id?: unknown;
  user_role?: string;
  // TODO: "admin" only when the admin panel asks; the public site always gets the personal feed, even for admins.
  scope?: "user" | "admin";
};

export const usesAdminFeed = (actor: NotificationActor) =>
  actor.scope === "admin" && actor.user_role === "admin";

export type NotificationTarget = {
  recipient: unknown;
  audience: "user" | "admin";
};

export const canReadNotification = (
  notification: NotificationTarget,
  actor: NotificationActor,
): boolean => {
  if (notification.audience === "admin") {
    return usesAdminFeed(actor);
  }

  return (
    notification.audience === "user" &&
    !usesAdminFeed(actor) &&
    notification.recipient != null &&
    String(notification.recipient) === String(actor._id)
  );
};
