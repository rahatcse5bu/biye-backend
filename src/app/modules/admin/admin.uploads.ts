import { Request, Response } from "express";
import httpStatus from "http-status";
import { isValidObjectId } from "mongoose";
import catchAsync from "../../../shared/catchAsync";
import { UploadService } from "../upload/upload.service";
import { UserInfoModel } from "../user_info/user_info.model";
import GeneralInfo from "../general_info/general_info.model";
import BiodataRevision from "../biodata_revision/biodata_revision.model";
import { NotificationService } from "../notifications/notification.service";

const ROOT = `${UploadService.PROFILE_PHOTO_ROOT}/`;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ownerOf = (publicId: string) => publicId.slice(ROOT.length).split("/")[0];
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v) => typeof v === "string") : []);

// TODO: one page of uploaded profile photos with their owner and whether the profile actually uses them.
const listUploads = catchAsync(async (req: Request, res: Response) => {
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const biodata = String(req.query.biodata || "").trim();

  let prefix = ROOT;
  if (biodata) {
    const owner: any = /^\d+$/.test(biodata) ? await UserInfoModel.findOne({ user_id: Number(biodata) }).select("_id").lean() : null;
    if (!owner) return res.status(httpStatus.OK).json({ success: true, data: [], next_cursor: null });
    prefix = `${ROOT}${owner._id}/`;
  }

  // TODO: the Search API (unlike api.resources) can sort by upload time, so newest uploads come first.
  let search = UploadService.getCloudinary()
    .search.expression(`resource_type:image AND public_id:${prefix}*`)
    .sort_by("created_at", "desc")
    .max_results(30);
  if (cursor) search = search.next_cursor(cursor);
  const result: any = await search.execute();
  const resources: any[] = result.resources || [];

  const ownerIds = [...new Set(resources.map((r) => ownerOf(r.public_id)).filter(isValidObjectId))];
  const [users, infos, revisions]: any[][] = await Promise.all([
    UserInfoModel.find({ _id: { $in: ownerIds } }).select("user_id email user_status").lean(),
    GeneralInfo.find({ user: { $in: ownerIds } }).select("user photos approved_data.photos").lean(),
    BiodataRevision.find({ user: { $in: ownerIds }, status: { $in: ["draft", "pending"] } }).select("user changes.general_info.photos").lean(),
  ]);
  const byId = (rows: any[], key: string) => new Map(rows.map((row) => [String(row[key]), row]));
  const userMap = byId(users, "_id");
  const infoMap = byId(infos, "user");
  const revisionMap = byId(revisions, "user");

  const data = resources.map((r) => {
    const owner = ownerOf(r.public_id);
    const info: any = infoMap.get(owner);
    const live = [...strings(info?.approved_data?.photos), ...strings(info?.photos)];
    const staged = strings((revisionMap.get(owner) as any)?.changes?.general_info?.photos);
    const uses = (list: string[]) => list.some((url) => url.includes(`/${r.public_id}.`));
    const user: any = userMap.get(owner);
    return {
      public_id: r.public_id,
      url: r.secure_url,
      thumbnail: r.secure_url.replace("/upload/", "/upload/c_fill,w_240,h_240,q_auto,f_auto/"),
      bytes: r.bytes,
      width: r.width,
      height: r.height,
      created_at: r.created_at,
      owner: user ? { _id: user._id, user_id: user.user_id, email: user.email, user_status: user.user_status } : null,
      status: uses(live) ? "live" : uses(staged) ? "pending" : "unused",
    };
  });

  res.status(httpStatus.OK).json({ success: true, data, total: result.total_count ?? data.length, next_cursor: result.next_cursor || null });
});

// TODO: removes the file and pulls it from the profile, so a moderated photo can't linger as a broken image.
const deleteUpload = catchAsync(async (req: Request, res: Response) => {
  const publicId = String(req.body?.public_id || "");
  if (!publicId.startsWith(ROOT) || publicId.includes("..")) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Not a profile photo" });
  }
  const reason = String(req.body?.reason || "").trim().slice(0, 300);
  const owner = ownerOf(publicId);
  const pattern = new RegExp(`/${escapeRegex(publicId)}\\.`);

  let wasLive = false;
  if (isValidObjectId(owner)) {
    const update = await GeneralInfo.updateOne(
      { user: owner },
      { $pull: { photos: { $regex: pattern }, "approved_data.photos": { $regex: pattern } } },
    );
    wasLive = update.modifiedCount > 0;
    await BiodataRevision.updateMany(
      { user: owner, status: { $in: ["draft", "pending"] } },
      { $pull: { "changes.general_info.photos": { $regex: pattern } } },
    );
  }

  const result: any = await UploadService.getCloudinary().uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  if (result.result !== "ok" && result.result !== "not found") {
    return res.status(httpStatus.BAD_GATEWAY).json({ success: false, message: "Cloudinary could not delete the image" });
  }

  if (wasLive) {
    NotificationService.notify({
      recipient: owner,
      audience: "user",
      type: "moderation",
      title: "একটি ছবি সরানো হয়েছে",
      message: reason
        ? `আপনার বায়োডাটার একটি ছবি সরানো হয়েছে। কারণ: ${reason}`
        : "আপনার বায়োডাটার একটি ছবি নিয়ম অনুযায়ী না হওয়ায় সরানো হয়েছে।",
      link: "/user/account/edit-biodata",
    });
  }

  res.status(httpStatus.OK).json({ success: true, message: "Photo deleted", removed_from_profile: wasLive });
});

export const UploadsController = { listUploads, deleteUpload };
