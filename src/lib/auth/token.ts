const COOKIE_NAME = "album_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  return process.env.AUTH_SECRET || "dev-only-secret-change-me";
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toHex(signature);
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createSessionToken() {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${await hmac(issuedAt)}`;
}

export async function isValidSessionToken(token?: string | null) {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  const expected = await hmac(issuedAt);
  if (!timingSafeEqual(signature, expected)) return false;
  const age = Date.now() - Number(issuedAt);
  return Number.isFinite(age) && age < MAX_AGE * 1000;
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function getSessionMaxAge() {
  return MAX_AGE;
}
