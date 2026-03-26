import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env file - this runs when this module is imported
try {
    const envFile = readFileSync(resolve(".env"), "utf-8");
    envFile.split("\n").forEach((line) => {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith("#")) {
            return;
        }

        const [key, ...values] = line.split("=");
        const normalizedKey = key?.trim();

        if (normalizedKey && values.length > 0 && process.env[normalizedKey] == null) {
            process.env[normalizedKey] = values
                .join("=")
                .trim()
                .replace(/^["']|["']$/g, "");
        }
    });
} catch (e) {
    console.warn("Could not load .env file:", e);
}
