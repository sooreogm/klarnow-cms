import { createHash, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { AuthSessionResponse } from "@shared/auth";
import { pool } from "./db";

declare module "express-session" {
    interface SessionData {
        isAuthenticated?: boolean;
        username?: string;
    }
}

const DEFAULT_ADMIN_USERNAME = "admin";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export const SESSION_COOKIE_NAME = "klarnow.cms.sid";

function getRequiredEnv(name: string) {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`${name} must be set before the CMS can start.`);
    }

    return value;
}

function safeEqual(left: string, right: string) {
    const leftDigest = createHash("sha256").update(left).digest();
    const rightDigest = createHash("sha256").update(right).digest();

    return timingSafeEqual(leftDigest, rightDigest);
}

function getApiKeyFromRequest(req: Request) {
    const directHeader = req.get("x-api-key")?.trim();
    if (directHeader) {
        return directHeader;
    }

    const authorizationHeader = req.get("authorization");
    if (!authorizationHeader) {
        return undefined;
    }

    const [scheme, token] = authorizationHeader.split(" ", 2);
    if (scheme?.toLowerCase() !== "bearer") {
        return undefined;
    }

    const normalizedToken = token?.trim();
    return normalizedToken || undefined;
}

export function ensureAuthConfiguration() {
    getRequiredEnv("SESSION_SECRET");
    getRequiredEnv("CMS_ADMIN_PASSWORD");
    getRequiredEnv("CMS_API_KEY");
}

export function getAdminUsername() {
    return process.env.CMS_ADMIN_USERNAME?.trim() || DEFAULT_ADMIN_USERNAME;
}

export function buildAuthSessionResponse(
    req: Request
): AuthSessionResponse {
    const authenticated = req.session?.isAuthenticated === true;

    return {
        authenticated,
        username: authenticated ? req.session.username ?? getAdminUsername() : null,
    };
}

export function createSessionMiddleware() {
    const PgSessionStore = connectPgSimple(session);

    return session({
        name: SESSION_COOKIE_NAME,
        secret: getRequiredEnv("SESSION_SECRET"),
        resave: false,
        saveUninitialized: false,
        unset: "destroy",
        store: new PgSessionStore({
            pool,
            tableName: "user_sessions",
            createTableIfMissing: true,
        }),
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: SESSION_MAX_AGE_MS,
        },
    });
}

export function isValidAdminPassword(password: string) {
    return safeEqual(password, getRequiredEnv("CMS_ADMIN_PASSWORD"));
}

export function hasValidApiKey(req: Request) {
    const requestApiKey = getApiKeyFromRequest(req);

    if (!requestApiKey) {
        return false;
    }

    return safeEqual(requestApiKey, getRequiredEnv("CMS_API_KEY"));
}

export function requireApiAccess(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (
        req.method === "OPTIONS" ||
        req.session?.isAuthenticated === true ||
        hasValidApiKey(req)
    ) {
        return next();
    }

    return res.status(401).json({ error: "Unauthorized" });
}
