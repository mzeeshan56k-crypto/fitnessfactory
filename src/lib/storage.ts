// Server-side key/value storage.
//
// In production it uses Upstash Redis (also what Vercel KV provisions). Set
// either the Vercel KV variables (KV_REST_API_URL / KV_REST_API_TOKEN) or the
// Upstash ones (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
//
// With no KV configured it falls back to an in-memory store so the app still
// boots locally — data is NOT persisted in that mode (a warning is logged).
import "server-only";
import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const storageConfigured = Boolean(url && token);

const redis = storageConfigured ? new Redis({ url: url!, token: token! }) : null;

// Dev fallback: a JSON file in the working directory. Reliable across routes
// and restarts for local development. Production MUST use KV (the file system
// is read-only on serverless platforms), so a warning is logged if it runs
// there.
const DEV_FILE = path.join(process.cwd(), ".ffkc-dev-store.json");

let warned = false;
function warnOnce() {
  if (!warned && process.env.NODE_ENV === "production") {
    warned = true;
    console.warn(
      "[storage] No KV configured — falling back to a local file. This will NOT work on serverless. " +
        "Set KV_REST_API_URL and KV_REST_API_TOKEN (Vercel KV / Upstash).",
    );
  }
}

function readFile(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(DEV_FILE, "utf8"));
  } catch {
    return {};
  }
}
function writeFile(obj: Record<string, unknown>) {
  try {
    fs.writeFileSync(DEV_FILE, JSON.stringify(obj));
  } catch {
    /* ignore (read-only fs) */
  }
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (!redis) {
    warnOnce();
    return (readFile()[key] as T) ?? null;
  }
  return (await redis.get<T>(key)) ?? null;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  if (!redis) {
    warnOnce();
    const obj = readFile();
    obj[key] = value as unknown;
    writeFile(obj);
    return;
  }
  await redis.set(key, value);
}

export async function kvDel(key: string): Promise<void> {
  if (!redis) {
    const obj = readFile();
    delete obj[key];
    writeFile(obj);
    return;
  }
  await redis.del(key);
}
