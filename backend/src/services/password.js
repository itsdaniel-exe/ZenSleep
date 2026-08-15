// Password hashing via Web Crypto PBKDF2 (native to the Workers runtime -
// no dependency needed). Stored as "saltHex:hashHex".

const ITERATIONS = 100_000;
const HASH_BITS = 256;

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

async function derive(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, key, HASH_BITS);
  return bufferToHex(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  return `${bufferToHex(salt)}:${hash}`;
}

/** Constant-time-ish comparison to avoid short-circuiting on the first differing byte. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password, stored) {
  const [saltHex, expectedHash] = stored.split(":");
  if (!saltHex || !expectedHash) return false;
  const actualHash = await derive(password, hexToBuffer(saltHex));
  return timingSafeEqual(actualHash, expectedHash);
}
