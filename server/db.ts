import "./env-loader";

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { getPgSslConfig } from "./db-ssl";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
    );
}

// Clean connection string by removing SSL-related query params that might conflict
// We'll handle SSL via the ssl config object instead
const cleanConnectionString = process.env.DATABASE_URL.replace(
    /[?&]sslmode=[^&]*/gi,
    ""
)
    .replace(/[?&]sslcert=[^&]*/gi, "")
    .replace(/[?&]sslkey=[^&]*/gi, "")
    .replace(/[?&]sslrootcert=[^&]*/gi, "");

const ssl = getPgSslConfig();

export const pool = new Pool({
    connectionString: cleanConnectionString,
    ...(ssl ? { ssl } : {}),
});

// Test database connection on startup
pool.on("error", (err) => {
    console.error("Database pool error:", err);
});

// Test connection
pool.connect()
    .then((client) => {
        console.log("Database connection successful");
        client.release();
    })
    .catch((err) => {
        console.error("Failed to connect to database:", err);
        console.error(
            "DATABASE_URL:",
            process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@")
        );
    });

export const db = drizzle({ client: pool, schema });
