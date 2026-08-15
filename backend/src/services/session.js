import { sign, verify } from "hono/jwt";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

const COOKIE_NAME = "zensleep_session";
const SESSION_DAYS = 30;

/** @param {import("hono").Context} c */
function isSecureRequest(c) {
  return new URL(c.req.url).protocol === "https:";
}

/** @param {import("hono").Context} c */
export async function createSession(c, user) {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: user.id, email: user.email, iat: now, exp: now + SESSION_DAYS * 24 * 60 * 60 },
    c.env.SESSION_SECRET
  );
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureRequest(c),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** @param {import("hono").Context} c */
export function clearSession(c) {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

/**
 * @param {import("hono").Context} c
 * @returns {Promise<{sub: string, email: string} | null>}
 */
export async function readSession(c) {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;
  try {
    return await verify(token, c.env.SESSION_SECRET, "HS256");
  } catch {
    return null; // expired / tampered / signed with a rotated secret
  }
}

/** Hono middleware: 401s unless a valid session cookie is present. Sets c.set("userId", ...). */
export async function requireAuth(c, next) {
  const session = await readSession(c);
  if (!session) return c.json({ error: "Not authenticated" }, 401);
  c.set("userId", session.sub);
  c.set("userEmail", session.email);
  await next();
}
