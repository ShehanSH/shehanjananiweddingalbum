import { cookies } from "next/headers";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
  isValidSessionToken,
} from "./token";

function normalizeSecret(value: string) {
  return value.trim().replace(/^["']|["']$/g, "");
}

export function verifyAdminPassword(password: string) {
  const expected = normalizeSecret(process.env.ADMIN_PASSWORD || "");
  const given = normalizeSecret(password);
  if (!expected || !given) return false;
  if (expected.length !== given.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createAdminSession() {
  const token = await createSessionToken();
  const store = await cookies();
  store.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionMaxAge(),
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(getSessionCookieName());
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return isValidSessionToken(store.get(getSessionCookieName())?.value);
}

export { getSessionCookieName, isValidSessionToken };
