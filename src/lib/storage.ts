// Server-side key/value storage with three backends, picked automatically:
//   1. Upstash REST  (KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_* names)
//   2. Redis over TCP (REDIS_URL or KV_URL — e.g. "Official Redis for Vercel")
//   3. Local JSON file (development only, when nothing is configured)
import "server-only";
import fs from "fs";
import path from "path";
import { Redis as UpstashRedis } from "@upstash/redis";
import IORedis from "ioredis";

const upstashUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redisUrl = process.env.REDIS_URL || process.env.KV_URL;

export const storageConfigured = Boolean((upstashUrl && upstashToken) || redisUrl);

type GlobalStore = {
  __ffkcUpstash?: UpstashRedis;
  __ffkcIORedis?: IORedis;
};
const g = globalThis as unknown as GlobalStore;

// Reuse a single client across warm serverless invocations.
const upstash =
  upstashUrl && upstashToken
    ? g.__ffkcUpstash ?? (g.__ffkcUpstash = new UpstashRedis({ url: upstashUrl, token: upstashToken }))
    : null;

const ioredis =
  !upstash && redisUrl
    ? g.__ffkcIORedis ??
      (g.__ffkcIORedis = new IORedis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false }))
    : null;

// Local dev fallback: a JSON file in the working directory.
const DEV_FILE = path.join(process.cwd(), ".ffkc-dev-store.json");
let warned = false;
function warnOnce() {
  if (!warned && process.env.NODE_ENV === "production") {
    warned = true;
    console.warn(
      "[storage] No KV/Redis configured — falling back to a local file (not for production). " +
        "Set REDIS_URL, or KV_REST_API_URL + KV_REST_API_TOKEN.",
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
  if (upstash) return (await upstash.get<T>(key)) ?? null;
  if (ioredis) {
    const v = await ioredis.get(key);
    return v ? (JSON.parse(v) as T) : null;
  }
  warnOnce();
  return (readFile()[key] as T) ?? null;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  if (upstash) {
    await upstash.set(key, value);
    return;
  }
  if (ioredis) {
    await ioredis.set(key, JSON.stringify(value));
    return;
  }
  warnOnce();
  const obj = readFile();
  obj[key] = value as unknown;
  writeFile(obj);
}

export async function kvDel(key: string): Promise<void> {
  if (upstash) {
    await upstash.del(key);
    return;
  }
  if (ioredis) {
    await ioredis.del(key);
    return;
  }
  const obj = readFile();
  delete obj[key];
  writeFile(obj);
}
