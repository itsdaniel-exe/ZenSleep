import { JSONFilePreset } from "lowdb/node";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const defaultData = { sessions: [] };

let dbPromise;
function getDb() {
  if (!dbPromise) {
    dbPromise = mkdir(DATA_DIR, { recursive: true }).then(() => JSONFilePreset(DB_FILE, defaultData));
  }
  return dbPromise;
}

/** @param {object} session must include id, userId, createdAt, plus scoring output */
export async function saveSession(session) {
  const db = await getDb();
  db.data.sessions.push(session);
  await db.write();
  return session;
}

export async function getLatestSession(userId) {
  const db = await getDb();
  const sessions = db.data.sessions.filter((s) => s.userId === userId);
  if (!sessions.length) return null;
  return sessions.reduce((latest, s) => (s.createdAt > latest.createdAt ? s : latest));
}

export async function getHistory(userId, limit = 14) {
  const db = await getDb();
  return db.data.sessions
    .filter((s) => s.userId === userId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-limit)
    .map(({ epochs, ...summary }) => summary); // trend view only needs the scored summary
}
