import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env file - this runs when this module is imported
try {
    const envFile = readFileSync(resolve(".env"), "utf-8");
    envFile.split("\n").forEach((line) => {
        const [key, ...values] = line.split("=");
        if (key && values.length > 0) {
            process.env[key.trim()] = values
                .join("=")
                .trim()
                .replace(/^["']|["']$/g, "");
        }
    });
} catch (e) {
    console.warn("Could not load .env file:", e);
}
