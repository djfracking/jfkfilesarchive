const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Fetches the most recent cached result from `historicalSearchIndex`
 * where each document ID is the normalized query string.
 */
async function fetchFromHistoricalSearchIndex(query) {
  const cleanedQuery = query.trim().toLowerCase();
  const doc = await db.collection("historicalSearchIndex").doc(cleanedQuery).get();

  if (!doc.exists) return null;

  const data = doc.data();
  // If a file's count is missing, default to 1.
  const files = Array.isArray(data.files)
    ? data.files.map(f => ({ name: f.name, count: f.count !== undefined ? f.count : 1 }))
    : [];

  if (!files.length) return null;

  return {
    word: cleanedQuery,
    files,
  };
}

module.exports = { fetchFromHistoricalSearchIndex };
