export type NotificationActor = {
  _id?: unknown;
  user_role?: string;
};

export type NotificationTarget = {
  recipient: unknown;
  audience: "user" | "admin";
};

export const canReadNotification = (
  notification: NotificationTarget,
  actor: NotificationActor,
): boolean => {
  if (notification.audience === "admin") {
    return actor.user_role === "admin";
  }

  return (
    notification.audience === "user" &&
    actor.user_role === "user" &&
    notification.recipient != null &&
    String(notification.recipient) === String(actor._id)
  );
};
