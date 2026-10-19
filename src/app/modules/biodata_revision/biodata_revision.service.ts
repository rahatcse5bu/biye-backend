import mongoose, { Types } from "mongoose";
import ApiError from "../../middlewares/ApiError";
import { UserInfoModel } from "../user_info/user_info.model";
import { NotificationService } from "../notifications/notification.service";
import { UploadService } from "../upload/upload.service";
import { mailUserByIdWith, toBanglaDigits } from "../../../shared/bibahoMail";
import { emailTemplates } from "../../../shared/emailTemplates";
import BiodataRevision, { IBiodataRevision, OPEN_STATUSES, SectionChanges } from "./biodata_revision.model";
import { BIODATA_SECTIONS, CONTACT_FIELDS, FIELD_LABELS, IGNORED_FIELDS, SENSITIVE_FIELDS, sectionByKey } from "./biodata_revision.sections";

type Doc = Record<string, any>;

// TODO: only published (active) biodatas are reviewed per change; new/inactive ones go through the full "in review" flow.
const isPublished = async (userId: unknown): Promise<boolean> => {
  const user: any = await UserInfoModel.findById(userId).select("user_status").lean();
  return user?.user_status === "active";
};

// TODO: what the public currently sees; general info shows its approved snapshot over the raw fields.
const liveDoc = async (sectionKey: string, userId: unknown, session?: mongoose.ClientSession): Promise<Doc | null> => {
  const section = sectionByKey(sectionKey);
  if (!section) return null;
  const doc: any = await section.model.findOne({ user: userId }).session(session || null).lean();
  if (!doc) return null;
  if (sectionKey === "general_info" && doc.approved_data && typeof doc.approved_data === "object") {
    return { ...doc, ...doc.approved_data };
  }
  return doc;
};

const DATE_LIKE = /^\d{4}-\d{2}-\d{2}/;

// TODO: "", null, undefined and [] all mean "empty"; Dates/ObjectIds compare by value.
const normalize = (value: unknown): unknown => {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Types.ObjectId) return String(value);
  if (Array.isArray(value)) return value.length ? value.map(normalize) : null;
  if (typeof value === "object") {
    const out: Doc = {};
    for (const key of Object.keys(value as Doc).sort()) {
      if (key === "_id") continue;
      const v = normalize((value as Doc)[key]);
      if (v !== null) out[key] = v;
    }
    return Object.keys(out).length ? out : null;
  }
  return value;
};

export const sameValue = (a: unknown, b: unknown): boolean => {
  const x = normalize(a);
  const y = normalize(b);
  if (x === null || y === null) return x === y;
  if (typeof x !== "object" && typeof y !== "object") {
    if (String(x) === String(y)) return true;
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

const BN_DIGITS: Record<string, string> = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" };

const textOf = (value: unknown): string =>
  Array.isArray(value) ? value.map(textOf).join(" ") : value && typeof value === "object" ? Object.values(value).map(textOf).join(" ") : typeof value === "string" ? value : "";

// TODO: members sometimes hide contact details in free text to skip the paid unlock; flag them for the admin.
const contactLeaks = (value: unknown): string[] => {
  const text = textOf(value);
  if (!text) return [];
  const digits = text.replace(/[০-৯]/g, (d) => BN_DIGITS[d]).replace(/[\s\-().]/g, "");
  const found: string[] = [];
  if (/(?:\+?88)?01[3-9]\d{8}/.test(digits)) found.push("লেখায় মোবাইল নাম্বার আছে");
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text)) found.push("লেখায় ইমেইল ঠিকানা আছে");
  if (/(https?:\/\/|www\.)\S+|\b(facebook|fb|wa|t)\.(com|me)\b|whatsapp|telegram|imo\b/i.test(text)) found.push("লেখায় লিংক/সোশ্যাল যোগাযোগ আছে");
  return found;
};

const openRevision = (userId: unknown, session?: mongoose.ClientSession) =>
  BiodataRevision.findOne({ user: userId, status: { $in: OPEN_STATUSES } }).session(session || null);

const countFields = (changes: SectionChanges = {}) =>
  Object.values(changes).reduce((sum, fields) => sum + Object.keys(fields || {}).length, 0);

const photosOf = (doc: Doc | null | undefined): string[] =>
  Array.isArray(doc?.photos) ? doc!.photos.filter((url: unknown) => typeof url === "string") : [];

// TODO: best-effort Cloudinary cleanup; a failed delete must never block a review decision.
const destroyPhotos = (urls: string[], userId: unknown) => {
  for (const url of urls) {
    UploadService.deleteProfileImage(url, String(userId)).catch((error) =>
      console.error("Photo cleanup failed:", url, error?.message || error),
    );
  }
};

export const BiodataRevisionService = {
  isPublished,
  liveDoc,

  // TODO: records only the fields that differ from the live biodata; reverting a field drops it from the revision.
  stage: async (userId: unknown, sectionKey: string, body: Doc) => {
    const live = (await liveDoc(sectionKey, userId)) || {};
    let revision = await openRevision(userId);
    const sectionChanges: Doc = { ...(revision?.changes?.[sectionKey] || {}) };

    for (const [field, value] of Object.entries(body || {})) {
      if (IGNORED_FIELDS.has(field)) continue;
      if (sameValue(value, live[field])) delete sectionChanges[field];
      else sectionChanges[field] = value;
    }

    if (!revision) {
      if (!Object.keys(sectionChanges).length) return { live, staged: {}, revision: null };
      try {
        revision = await BiodataRevision.create({ user: userId, status: "draft", changes: {} });
      } catch (error: any) {
        // TODO: two saves raced to create the open revision; the unique index kept one, so reuse it.
        if (error?.code !== 11000) throw error;
        revision = await openRevision(userId);
        if (!revision) throw error;
      }
    }

    const changes: SectionChanges = { ...(revision.changes || {}) };
    if (Object.keys(sectionChanges).length) changes[sectionKey] = sectionChanges;
    else delete changes[sectionKey];

    if (!countFields(changes)) {
      if (revision.status === "draft") {
        await revision.deleteOne();
        return { live, staged: {}, revision: null };
      }
      revision.status = "withdrawn";
    }
    revision.changes = changes;
    revision.markModified("changes");
    await revision.save();
    return { live, staged: sectionChanges, revision };
  },

  stagedFor: async (userId: unknown, sectionKey: string): Promise<Doc | null> => {
    const revision: any = await BiodataRevision.findOne({ user: userId, status: { $in: OPEN_STATUSES } })
      .select("changes")
      .lean();
    return revision?.changes?.[sectionKey] || null;
  },

  hasOpenRevision: async (userId: unknown, statuses = OPEN_STATUSES) =>
    Boolean(await BiodataRevision.exists({ user: userId, status: { $in: statuses } })),

  // TODO: the user's open revision plus their latest decision, for the edit-biodata status banner.
  mine: async (userId: unknown) => {
    const [open, last]: any[] = await Promise.all([
      BiodataRevision.findOne({ user: userId, status: { $in: OPEN_STATUSES } }).lean(),
      BiodataRevision.findOne({ user: userId, status: { $in: ["approved", "rejected"] } })
        .sort({ reviewed_at: -1 })
        .select("status admin_note reviewed_at")
        .lean(),
    ]);
    const sections = open
      ? Object.keys(open.changes || {}).map((key) => ({
          key,
          label: sectionByKey(key)?.label || key,
          fields: Object.keys(open.changes[key] || {}).length,
        }))
      : [];
    return {
      published: await isPublished(userId),
      open: open
        ? { _id: open._id, status: open.status, submitted_at: open.submitted_at, updatedAt: open.updatedAt, field_count: countFields(open.changes), sections }
        : null,
      last_decision: last || null,
    };
  },

  submit: async (userId: unknown) => {
    const revision = await openRevision(userId);
    if (!revision || !countFields(revision.changes)) {
      throw new ApiError(400, "জমা দেওয়ার মতো কোনো পরিবর্তন নেই");
    }
    const firstSubmit = revision.status === "draft";
    revision.status = "pending";
    revision.submitted_at = new Date();
    await revision.save();

    if (firstSubmit) {
      const user: any = await UserInfoModel.findById(userId).select("user_id").lean();
      NotificationService.notify({
        audience: "admin",
        type: "moderation",
        priority: "important",
        title: "বায়োডাটা পরিবর্তনের অনুরোধ",
        message: `বায়োডাটা #${user?.user_id ?? ""} এর ${countFields(revision.changes)}টি পরিবর্তন অনুমোদনের অপেক্ষায়।`,
        link: `/biodata-changes?id=${revision._id}`,
      });
    }
    return revision;
  },

  // TODO: drafts are dropped, pending ones are kept as "withdrawn" history; photos only this revision uploaded are deleted.
  withdraw: async (userId: unknown) => {
    const revision = await openRevision(userId);
    if (!revision) throw new ApiError(404, "কোনো খোলা পরিবর্তন নেই");
    const live = await liveDoc("general_info", userId);
    const stagedPhotos = photosOf(revision.changes?.general_info as Doc);
    destroyPhotos(stagedPhotos.filter((url) => !photosOf(live).includes(url)), userId);

    if (revision.status === "draft") await revision.deleteOne();
    else {
      revision.status = "withdrawn";
      await revision.save();
    }
  },

  // TODO: per-section rows of { field, before, after }; open revisions compare with the live biodata, decided ones with the frozen snapshot.
  diff: async (revision: IBiodataRevision | Doc) => {
    const decided = !OPEN_STATUSES.includes(revision.status);
    const sections = [];
    for (const section of BIODATA_SECTIONS) {
      const changed: Doc | undefined = (revision.changes as SectionChanges)?.[section.key];
      if (!changed || !Object.keys(changed).length) continue;
      const before: Doc = decided ? revision.previous?.[section.key] || {} : (await liveDoc(section.key, revision.user)) || {};
      sections.push({
        key: section.key,
        label: section.label,
        fields: Object.keys(changed).map((field) => {
          const path = `${section.key}.${field}`;
          const beforeValue = before[field] ?? null;
          const afterValue = changed[field];
          const warnings = [
            ...(SENSITIVE_FIELDS[path] ? [SENSITIVE_FIELDS[path]] : []),
            ...(CONTACT_FIELDS.has(path) || field === "photos" ? [] : contactLeaks(afterValue)),
          ];
          return {
            field,
            label: FIELD_LABELS[section.key]?.[field] || field,
            kind: normalize(beforeValue) === null ? "added" : normalize(afterValue) === null ? "removed" : "changed",
            before: beforeValue,
            after: afterValue,
            warnings,
          };
        }),
      });
    }
    return sections;
  },

  list: async ({ status, page, limit }: { status?: string; page: number; limit: number }) => {
    const filter: Doc = status ? { status } : { status: { $ne: "draft" } };
    const [items, total]: [any[], number] = await Promise.all([
      BiodataRevision.find(filter)
        .sort({ submitted_at: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "user_id email username user_status")
        .lean(),
      BiodataRevision.countDocuments(filter),
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
        sections: Object.keys(item.changes || {}).map((key) => sectionByKey(key)?.label || key),
      })),
      total,
    };
  },

  detail: async (id: string) => {
    const revision: any = await BiodataRevision.findById(id)
      .populate("user", "user_id email username user_status")
      .populate("reviewed_by", "email username")
      .lean();
    if (!revision) throw new ApiError(404, "Change request not found");
    const userId = revision.user?._id || revision.user;
    // TODO: context for the decision: who the member is and how their earlier requests went.
    const [sections, live, account, history]: any[] = await Promise.all([
      BiodataRevisionService.diff({ ...revision, user: userId }),
      liveDoc("general_info", userId),
      UserInfoModel.findById(userId).select("createdAt").lean(),
      BiodataRevision.find({ user: userId, _id: { $ne: revision._id }, status: { $in: ["approved", "rejected", "withdrawn"] } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("status reviewed_at updatedAt admin_note changes")
        .lean(),
    ]);
    return {
      ...revision,
      changes: undefined,
      previous: undefined,
      member: {
        bio_type: live?.bio_type || null,
        gender: live?.gender || null,
        religion: live?.religion || null,
        photo: photosOf(live)[0] || null,
        joined_at: account?.createdAt || null,
      },
      history: history.map((item: any) => ({
        _id: item._id,
        status: item.status,
        decided_at: item.reviewed_at || item.updatedAt,
        admin_note: item.admin_note,
        field_count: countFields(item.changes),
      })),
      sections,
    };
  },

  // TODO: applies every staged section in one transaction; refuses if the user changed it after the admin loaded it.
  approve: async (id: string, adminId: unknown, expectedUpdatedAt?: string) => {
    const session = await mongoose.startSession();
    let revision: any;
    let removedPhotos: string[] = [];
    try {
      await session.withTransaction(async () => {
        revision = await BiodataRevision.findById(id).session(session);
        if (!revision) throw new ApiError(404, "Change request not found");
        if (revision.status !== "pending") throw new ApiError(400, "Only pending change requests can be approved");
        if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== revision.updatedAt.getTime()) {
          throw new ApiError(409, "The user changed this request after you opened it. Reload and review again.");
        }

        const previous: SectionChanges = {};
        for (const [sectionKey, fields] of Object.entries((revision.changes || {}) as SectionChanges)) {
          const section = sectionByKey(sectionKey);
          if (!section || !fields || !Object.keys(fields).length) continue;
          const live = (await liveDoc(sectionKey, revision.user, session)) || {};
          previous[sectionKey] = Object.fromEntries(Object.keys(fields).map((field) => [field, live[field] ?? null]));

          if (sectionKey === "general_info") {
            const doc: any = await section.model.findOne({ user: revision.user }).select("approved_data").session(session).lean();
            if (!doc) throw new ApiError(409, "General info no longer exists for this user");
            removedPhotos = fields.photos !== undefined ? photosOf(live).filter((url) => !photosOf(fields).includes(url)) : [];
            // TODO: $set instead of save() so older profiles missing now-required fields can still be approved.
            await section.model.updateOne(
              { user: revision.user },
              {
                $set: {
                  ...fields,
                  approved_data: { ...(doc.approved_data || {}), ...fields },
                  pending_changes: null,
                  biodata_status: "approved",
                  admin_note: "",
                  last_approved_at: new Date(),
                  last_approved_by: adminId,
                },
                $inc: { version: 1 },
              },
              { session },
            );
          } else {
            await section.model.findOneAndUpdate(
              { user: revision.user },
              { $set: fields, $setOnInsert: { user: revision.user } },
              { upsert: true, session, setDefaultsOnInsert: true },
            );
          }
        }

        revision.previous = previous;
        revision.markModified("previous");
        revision.status = "approved";
        revision.reviewed_at = new Date();
        revision.reviewed_by = adminId;
        revision.admin_note = "";
        await revision.save({ session });
      });
    } finally {
      await session.endSession();
    }

    destroyPhotos(removedPhotos, revision.user);
    NotificationService.notify({
      recipient: String(revision.user),
      audience: "user",
      type: "moderation",
      title: "বায়োডাটার পরিবর্তন অনুমোদিত",
      message: "আপনার বায়োডাটার পরিবর্তনগুলো অনুমোদিত ও প্রকাশিত হয়েছে।",
      link: "/user/account/dashboard",
    });
    mailUserByIdWith(revision.user, (user) => {
      const mail = emailTemplates.biodataApproved({ name: user.username, biodataNo: user.user_id, changesOnly: true });
      mail.content.paragraphs = [
        `আপনার বায়োডাটার <strong>${toBanglaDigits(countFields(revision.changes))}টি</strong> পরিবর্তন যাচাই করে অনুমোদন করা হয়েছে এবং এখন সবার কাছে প্রকাশিত।`,
      ];
      return mail;
    });
    return revision;
  },

  reject: async (id: string, adminId: unknown, reason: string, expectedUpdatedAt?: string) => {
    const revision = await BiodataRevision.findById(id);
    if (!revision) throw new ApiError(404, "Change request not found");
    if (revision.status !== "pending") throw new ApiError(400, "Only pending change requests can be rejected");
    if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== revision.updatedAt.getTime()) {
      throw new ApiError(409, "The user changed this request after you opened it. Reload and review again.");
    }

    const previous: SectionChanges = {};
    for (const [sectionKey, fields] of Object.entries((revision.changes || {}) as SectionChanges)) {
      const live = (await liveDoc(sectionKey, revision.user)) || {};
      previous[sectionKey] = Object.fromEntries(Object.keys(fields || {}).map((field) => [field, live[field] ?? null]));
    }
    const live = await liveDoc("general_info", revision.user);
    destroyPhotos(photosOf(revision.changes?.general_info as Doc).filter((url) => !photosOf(live).includes(url)), revision.user);

    revision.previous = previous;
    revision.markModified("previous");
    revision.status = "rejected";
    revision.reviewed_at = new Date();
    revision.reviewed_by = adminId as any;
    revision.admin_note = reason;
    await revision.save();

    NotificationService.notify({
      recipient: String(revision.user),
      audience: "user",
      type: "moderation",
      title: "বায়োডাটার পরিবর্তন বাতিল",
      message: reason
        ? `আপনার বায়োডাটার পরিবর্তন অনুমোদিত হয়নি। কারণ: ${reason}`
        : "আপনার বায়োডাটার পরিবর্তন অনুমোদিত হয়নি। আগের সংস্করণটি প্রকাশিত আছে।",
      link: "/user/account/edit-biodata",
    });
    mailUserByIdWith(revision.user, (user) =>
      emailTemplates.biodataRejected({ name: user.username, biodataNo: user.user_id, reason, changesOnly: true }),
    );
    return revision;
  },
};
