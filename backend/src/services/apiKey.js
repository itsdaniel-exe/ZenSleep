// Device API keys: a high-entropy random token, hashed with SHA-256 for
// storage/lookup. Unlike user passwords (password.js, PBKDF2 + salt), these
// don't need slow hashing - the key itself is already 192 bits of randomness,
// nothing to brute-force. This is the same approach GitHub/Stripe use for
// API tokens.

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateApiKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `zs_${bufferToHex(bytes)}`;
}

export async function hashApiKey(key) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return bufferToHex(digest);
}
