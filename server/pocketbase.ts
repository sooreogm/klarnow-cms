export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const POCKETBASE_COLLECTION_NAME = "klarnow_blog_media";
const POCKETBASE_FILE_FIELD_NAME = "image";

interface PocketBaseAuthResponse {
  token?: string;
  message?: string;
}

interface PocketBaseRecordResponse {
  id: string;
  image?: string | string[];
  message?: string;
}

interface PocketBaseCollectionResponse {
  fields?: Array<{ name?: string }>;
}

export interface UploadedImageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface UploadImageInput {
  file: UploadedImageFile | undefined;
  kind?: string;
  articleId?: string;
  alt?: string;
}

export class UploadValidationError extends Error {}

export class PocketBaseUploadError extends Error {}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new PocketBaseUploadError(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

function getPocketBaseBaseUrl(): string {
  return getRequiredEnv("POCKETBASE_URL").replace(/\/+$/, "");
}

function getErrorMessage(
  body: { message?: string } | null,
  fallbackMessage: string,
): string {
  return body?.message?.trim() || fallbackMessage;
}

function assertValidImage(file: UploadedImageFile) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    throw new UploadValidationError(
      "Only JPEG, PNG, WEBP, and GIF images are allowed.",
    );
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new UploadValidationError("Image uploads must be 5MB or smaller.");
  }
}

function getUploadedFileName(record: PocketBaseRecordResponse): string {
  if (typeof record.image === "string" && record.image) {
    return record.image;
  }

  if (Array.isArray(record.image) && record.image[0]) {
    return record.image[0];
  }

  throw new PocketBaseUploadError(
    "PocketBase upload completed without returning the image filename.",
  );
}

function buildPublicFileUrl(recordId: string, fileName: string): string {
  return `${getPocketBaseBaseUrl()}/api/files/${POCKETBASE_COLLECTION_NAME}/${recordId}/${encodeURIComponent(
    fileName,
  )}`;
}

async function authenticatePocketBase(): Promise<string> {
  const response = await fetch(
    `${getPocketBaseBaseUrl()}/api/collections/_superusers/auth-with-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identity: getRequiredEnv("POCKETBASE_ADMIN_EMAIL"),
        password: getRequiredEnv("POCKETBASE_ADMIN_PASSWORD"),
      }),
    },
  );

  const responseBody = (await response
    .json()
    .catch(() => null)) as PocketBaseAuthResponse | null;

  if (!response.ok || !responseBody?.token) {
    throw new PocketBaseUploadError(
      getErrorMessage(
        responseBody,
        `PocketBase authentication failed with status ${response.status}.`,
      ),
    );
  }

  return responseBody.token;
}

async function getCollectionFieldNames(token: string): Promise<Set<string>> {
  const response = await fetch(
    `${getPocketBaseBaseUrl()}/api/collections/${POCKETBASE_COLLECTION_NAME}`,
    {
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    return new Set();
  }

  const responseBody = (await response
    .json()
    .catch(() => null)) as PocketBaseCollectionResponse | null;
  const fieldNames = new Set<string>();

  for (const field of responseBody?.fields || []) {
    if (typeof field.name === "string" && field.name) {
      fieldNames.add(field.name);
    }
  }

  return fieldNames;
}

export async function uploadImageToPocketBase({
  file,
  kind: rawKind,
  articleId: rawArticleId,
  alt: rawAlt,
}: UploadImageInput): Promise<{ recordId: string; url: string }> {
  if (!file) {
    throw new UploadValidationError("An image file is required.");
  }

  assertValidImage(file);

  const uploadFormData = new FormData();
  const kind = rawKind?.trim() || "article-image";
  const articleId = rawArticleId?.trim() || "";
  const alt = rawAlt?.trim() || "";

  const token = await authenticatePocketBase();
  const collectionFieldNames = await getCollectionFieldNames(token);

  uploadFormData.set(
    POCKETBASE_FILE_FIELD_NAME,
    new Blob([file.buffer], { type: file.mimetype }),
    file.originalname,
  );

  if (collectionFieldNames.has("kind")) {
    uploadFormData.set("kind", kind);
  }

  if (
    articleId &&
    articleId !== "new" &&
    collectionFieldNames.has("articleId")
  ) {
    uploadFormData.set("articleId", articleId);
  }

  if (alt && collectionFieldNames.has("alt")) {
    uploadFormData.set("alt", alt);
  }

  const response = await fetch(
    `${getPocketBaseBaseUrl()}/api/collections/${POCKETBASE_COLLECTION_NAME}/records`,
    {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: uploadFormData,
    },
  );

  const responseBody = (await response
    .json()
    .catch(() => null)) as PocketBaseRecordResponse | null;

  if (!response.ok || !responseBody?.id) {
    throw new PocketBaseUploadError(
      getErrorMessage(
        responseBody,
        `PocketBase upload failed with status ${response.status}.`,
      ),
    );
  }

  return {
    recordId: responseBody.id,
    url: buildPublicFileUrl(responseBody.id, getUploadedFileName(responseBody)),
  };
}
