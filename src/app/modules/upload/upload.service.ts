import { randomUUID } from "crypto";
import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import config from "../../../config";
import ApiError from "../../middlewares/ApiError";

const PROFILE_PHOTO_ROOT = "biye/profile-photos";

const getCloudinary = () => {
  if (
    !config.cloudinary_cloud_name ||
    !config.cloudinary_api_key ||
    !config.cloudinary_api_secret
  ) {
    throw new ApiError(500, "Cloudinary is not configured");
  }

  cloudinary.config({
    cloud_name: config.cloudinary_cloud_name,
    api_key: config.cloudinary_api_key,
    api_secret: config.cloudinary_api_secret,
    secure: true,
  });

  return cloudinary;
};

const uploadBuffer = (
  buffer: Buffer,
  folder: string
): Promise<UploadApiResponse> => {
  const client = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder,
        public_id: randomUUID(),
        resource_type: "image",
        overwrite: false,
        transformation: [
          {
            width: 1600,
            height: 1600,
            crop: "limit",
            quality: "auto:good",
          },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary did not return an upload result"));
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

const uploadProfileImages = async (
  files: Express.Multer.File[],
  userId: string
): Promise<string[]> => {
  const folder = `${PROFILE_PHOTO_ROOT}/${userId}`;
  const uploaded: UploadApiResponse[] = [];

  try {
    for (const file of files) {
      uploaded.push(await uploadBuffer(file.buffer, folder));
    }
    return uploaded.map((image) => image.secure_url);
  } catch (error) {
    const client = getCloudinary();
    await Promise.allSettled(
      uploaded.map((image) =>
        client.uploader.destroy(image.public_id, {
          resource_type: "image",
          invalidate: true,
        })
      )
    );
    throw new ApiError(502, "Image upload failed");
  }
};

const extractOwnedPublicId = (imageUrl: string, userId: string): string => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    throw new ApiError(400, "Invalid image URL");
  }

  if (parsedUrl.hostname !== "res.cloudinary.com") {
    throw new ApiError(400, "Only Cloudinary images can be deleted");
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  if (segments[0] !== config.cloudinary_cloud_name) {
    throw new ApiError(403, "Image does not belong to this application");
  }

  const uploadIndex = segments.indexOf("upload");
  const versionIndex = segments.findIndex(
    (segment, index) => index > uploadIndex && /^v\d+$/.test(segment)
  );
  if (uploadIndex < 0 || versionIndex < 0 || versionIndex === segments.length - 1) {
    throw new ApiError(400, "Invalid Cloudinary image URL");
  }

  const publicIdSegments = segments.slice(versionIndex + 1).map(decodeURIComponent);
  const lastSegment = publicIdSegments.pop();
  if (!lastSegment) {
    throw new ApiError(400, "Invalid Cloudinary image URL");
  }
  publicIdSegments.push(lastSegment.replace(/\.[^.]+$/, ""));

  const publicId = publicIdSegments.join("/");
  const ownedFolder = `${PROFILE_PHOTO_ROOT}/${userId}/`;
  if (!publicId.startsWith(ownedFolder)) {
    throw new ApiError(403, "You cannot delete this image");
  }

  return publicId;
};

const deleteProfileImage = async (
  imageUrl: string,
  userId: string
): Promise<void> => {
  const publicId = extractOwnedPublicId(imageUrl, userId);
  const result = await getCloudinary().uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new ApiError(502, "Image deletion failed");
  }
};

export const UploadService = {
  uploadProfileImages,
  deleteProfileImage,
};
