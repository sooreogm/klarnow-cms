import type { Request as ExpressRequest } from "express";
import { Readable } from "node:stream";

const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);
const POCKETBASE_COLLECTION_NAME = "blog_media";
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

export class UploadValidationError extends Error {}

export class PocketBaseUploadError extends Error {}

function getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new PocketBaseUploadError(
            `Missing required environment variable: ${name}`
        );
    }

    return value;
}

function getPocketBaseBaseUrl(): string {
    return getRequiredEnv("POCKETBASE_URL").replace(/\/+$/, "");
}

function buildHeaders(req: ExpressRequest): Headers {
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
            value.forEach((entry) => headers.append(key, entry));
            continue;
        }

        if (value) {
            headers.set(key, value);
        }
    }

    return headers;
}

function readFormValue(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function getErrorMessage(
    body: { message?: string } | null,
    fallbackMessage: string
): string {
    return body?.message?.trim() || fallbackMessage;
}

function assertValidImage(file: File) {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
        throw new UploadValidationError(
            "Only JPEG, PNG, WEBP, and GIF images are allowed."
        );
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        throw new UploadValidationError(
            "Image uploads must be 5MB or smaller."
        );
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
        "PocketBase upload completed without returning the image filename."
    );
}

function buildPublicFileUrl(recordId: string, fileName: string): string {
    return `${getPocketBaseBaseUrl()}/api/files/${POCKETBASE_COLLECTION_NAME}/${recordId}/${encodeURIComponent(
        fileName
    )}`;
}

export async function readMultipartFormData(
    req: ExpressRequest
): Promise<FormData> {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.startsWith("multipart/form-data")) {
        throw new UploadValidationError(
            "Uploads must be sent as multipart/form-data."
        );
    }

    const requestInit: RequestInit & { duplex: "half" } = {
        method: req.method,
        headers: buildHeaders(req),
        body: Readable.toWeb(req) as BodyInit,
        duplex: "half",
    };
    const request = new Request(
        "http://localhost/api/uploads/images",
        requestInit
    );

    return await request.formData();
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
        }
    );

    const responseBody = (await response
        .json()
        .catch(() => null)) as PocketBaseAuthResponse | null;

    if (!response.ok || !responseBody?.token) {
        throw new PocketBaseUploadError(
            getErrorMessage(
                responseBody,
                `PocketBase authentication failed with status ${response.status}.`
            )
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
        }
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

export async function uploadImageToPocketBase(
    formData: FormData
): Promise<{ recordId: string; url: string }> {
    const file = formData.get(POCKETBASE_FILE_FIELD_NAME);

    if (!(file instanceof File)) {
        throw new UploadValidationError("An image file is required.");
    }

    assertValidImage(file);

    const uploadFormData = new FormData();
    const kind = readFormValue(formData, "kind") || "article-image";
    const articleId = readFormValue(formData, "articleId");
    const alt = readFormValue(formData, "alt");

    const token = await authenticatePocketBase();
    const collectionFieldNames = await getCollectionFieldNames(token);

    uploadFormData.set(POCKETBASE_FILE_FIELD_NAME, file, file.name);

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
        }
    );

    const responseBody = (await response
        .json()
        .catch(() => null)) as PocketBaseRecordResponse | null;

    if (!response.ok || !responseBody?.id) {
        throw new PocketBaseUploadError(
            getErrorMessage(
                responseBody,
                `PocketBase upload failed with status ${response.status}.`
            )
        );
    }

    return {
        recordId: responseBody.id,
        url: buildPublicFileUrl(
            responseBody.id,
            getUploadedFileName(responseBody)
        ),
    };
}
