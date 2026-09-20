import { uploadSpaceImage } from "@/lib/api";

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
