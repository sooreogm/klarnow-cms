/**
 * Cloud hosts (e.g. Aiven) need TLS; many self-hosted instances do not.
 * Use sslmode=require (or verify-*) in DATABASE_URL, or DATABASE_SSL=true, to enable TLS.
 */
export function getPgSslConfig():
    | undefined
    | { rejectUnauthorized: boolean } {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        return undefined;
    }

    const sslModeMatch = databaseUrl.match(/[?&]sslmode=([^&]+)/i);
    const sslMode = sslModeMatch?.[1]?.toLowerCase().trim();

    const explicit = process.env.DATABASE_SSL?.trim().toLowerCase();
    if (
        explicit === "0" ||
        explicit === "false" ||
        explicit === "off"
    ) {
        return undefined;
    }
    if (
        explicit === "1" ||
        explicit === "true" ||
        explicit === "on"
    ) {
        return { rejectUnauthorized: false };
    }

    if (
        sslMode === "require" ||
        sslMode === "verify-ca" ||
        sslMode === "verify-full"
    ) {
        return { rejectUnauthorized: false };
    }

    return undefined;
}
