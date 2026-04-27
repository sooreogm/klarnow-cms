import "./server/env-loader";

import { defineConfig } from "drizzle-kit";
import { getPgSslConfig } from "./server/db-ssl";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const ssl = getPgSslConfig();

export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL,
        ...(ssl ? { ssl } : {}),
    },
});
