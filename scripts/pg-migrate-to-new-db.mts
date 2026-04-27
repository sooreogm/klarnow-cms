/**
 * One-shot: dump DATABASE_URL and restore into NEW_DATABASE_URL.
 * Run from repo root: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/pg-migrate-to-new-db.mts
 */
import "../server/env-loader.ts";
import { mkdtempSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const src = process.env.DATABASE_URL?.trim();
const dst = process.env.NEW_DATABASE_URL?.trim();

if (!src) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
if (!dst) {
  console.error("NEW_DATABASE_URL is not set.");
  process.exit(1);
}

const dumpPath = join(mkdtempSync(join(tmpdir(), "cms-pg-migrate-")), "dump.fc");

function run(cmd: string, args: string[]): void {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED ?? "0",
    },
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

console.log("Dumping source database…");
run("pg_dump", ["-Fc", "--no-owner", "--no-acl", "-f", dumpPath, src]);

console.log("Restoring into target database…");
run("pg_restore", [
  "--no-owner",
  "--no-acl",
  "--verbose",
  "-d",
  dst,
  dumpPath,
]);

try {
  unlinkSync(dumpPath);
} catch {
  /* ignore */
}

console.log("Done.");
