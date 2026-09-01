/**
 * Client-Side Direct Cloudinary Upload Utility with Web Crypto SHA-1
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "n2q3f6uz";
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "998714454127672";
const API_SECRET = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET || "znTPktUS-hVwZQGLcZXc_qZ4aoE";

async function sha1Hex(str: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadDirectToCloudinary(
  file: File,
  folder: string = "smartspace/spaces"
): Promise<{ url: string; publicId: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha1Hex(stringToSign);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gagal mengunggah foto ke Cloudinary CDN.");
  }

  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
  };
}
