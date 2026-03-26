import { apiRequest } from "@/lib/queryClient";

const ACCEPTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif";

interface UploadCmsImageOptions {
  file: File;
  kind: "cover" | "article-content";
  articleId?: string;
  alt?: string;
}

function assertValidImage(file: File) {
  if (!ACCEPTED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WEBP, and GIF images are allowed.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Image uploads must be 5MB or smaller.");
  }
}

export async function uploadCmsImage({
  file,
  kind,
  articleId,
  alt,
}: UploadCmsImageOptions): Promise<string> {
  assertValidImage(file);

  const formData = new FormData();
  formData.set("image", file);
  formData.set("kind", kind);

  if (articleId && articleId !== "new") {
    formData.set("articleId", articleId);
  }

  if (alt?.trim()) {
    formData.set("alt", alt.trim());
  }

  const response = await apiRequest("POST", "/api/uploads/images", formData);
  const data = (await response.json()) as { url?: string };

  if (!data.url) {
    throw new Error("Upload succeeded, but no image URL was returned.");
  }

  return data.url;
}
