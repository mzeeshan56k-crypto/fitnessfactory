// Account storage + password handling (Node runtime only).
import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { kvGet, kvSet, kvDel } from "@/lib/storage";
import { SESSION_COOKIE, verifySession, type Role, type SessionUser } from "@/lib/auth/session";

export interface Account {
  email: string; // lowercase — the identifier
  name: string;
  role: Role;
  status: "active" | "invited" | "suspended";
  passwordHash?: string;
  inviteToken?: string;
  clientId?: string; // for members: the client record they own
  createdAt: string;
}

const userKey = (email: string) => `ffkc:user:${email.toLowerCase()}`;
const INDEX_KEY = "ffkc:users"; // string[] of emails
const OWNER_KEY = "ffkc:owner"; // email of the owner account

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getAccount(email: string): Promise<Account | null> {
  return kvGet<Account>(userKey(email));
}

export async function hasOwner(): Promise<boolean> {
  return Boolean(await kvGet<string>(OWNER_KEY));
}

async function addToIndex(email: string) {
  const list = (await kvGet<string[]>(INDEX_KEY)) ?? [];
  if (!list.includes(email)) {
    list.push(email);
    await kvSet(INDEX_KEY, list);
  }
}

export async function listAccounts(): Promise<Account[]> {
  const list = (await kvGet<string[]>(INDEX_KEY)) ?? [];
  const accounts = await Promise.all(list.map((e) => getAccount(e)));
  return accounts.filter((a): a is Account => Boolean(a));
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function createAccount(input: {
  email: string;
  name: string;
  role: Role;
  password?: string;
  status?: "active" | "invited" | "suspended";
  inviteToken?: string;
  clientId?: string;
}): Promise<Account> {
  const email = normalizeEmail(input.email);
  const account: Account = {
    email,
    name: input.name.trim() || email,
    role: input.role,
    status: input.status ?? "active",
    passwordHash: input.password ? await hashPassword(input.password) : undefined,
    inviteToken: input.inviteToken,
    clientId: input.clientId,
    createdAt: new Date().toISOString(),
  };
  await kvSet(userKey(email), account);
  await addToIndex(email);
  if (account.role === "owner" && !(await hasOwner())) {
    await kvSet(OWNER_KEY, email);
  }
  return account;
}

export async function updateAccount(email: string, patch: Partial<Account>): Promise<Account | null> {
  const existing = await getAccount(email);
  if (!existing) return null;
  const next = { ...existing, ...patch, email: existing.email };
  await kvSet(userKey(email), next);
  return next;
}

export async function deleteAccount(email: string): Promise<void> {
  const e = normalizeEmail(email);
  await kvDel(userKey(e));
  const list = (await kvGet<string[]>(INDEX_KEY)) ?? [];
  await kvSet(INDEX_KEY, list.filter((x) => x !== e));
}

export async function verifyCredentials(email: string, password: string): Promise<Account | null> {
  const account = await getAccount(email);
  if (!account || !account.passwordHash || account.status !== "active") return null;
  const ok = await bcrypt.compare(password, account.passwordHash);
  return ok ? account : null;
}

export function toSessionUser(account: Account): SessionUser {
  return { email: account.email, name: account.name, role: account.role, clientId: account.clientId };
}

/** Read + verify the current session from the request cookies. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}
