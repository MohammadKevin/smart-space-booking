import { uploadSpaceImage } from "@/lib/api";

/**
 * Secure image uploader delegating to backend API /spaces/upload
 * Prevents exposing Cloudinary API Secret to client browsers (Fixes BUG-001)
 */
export async function uploadDirectToCloudinary(
  file: File,
  _folder: string = "smartspace/spaces"
): Promise<{ url: string; publicId: string }> {
  const result = await uploadSpaceImage(file);
  return {
    url: result.url,
    publicId: result.publicId || "",
  };
}
