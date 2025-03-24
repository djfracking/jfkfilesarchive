const admin = require("firebase-admin");

const db = admin.firestore();

async function logSearchHistory({ query, correctedWords, topResults }) {
  const timestamp = new Date();
  const cleanedQuery = query.trim().toLowerCase();

  const doc = {
    query: cleanedQuery,
    correctedWords,
    topResultNames: topResults.map(r => r.name),
    resultCount: topResults.length,
    timestamp,
  };

  try {
    // 1. Log full history (append)
    await db.collection("searchHistory").add(doc);

    // 2. Overwrite cache
    await db.collection("historicalSearchIndex").doc(cleanedQuery).set({
      files: topResults,
      correctedWords,
      timestamp,
    });

    console.log("📝 Search history + cache logged.");
  } catch (err) {
    console.error("❌ Failed to log search:", err);
  }
}

module.exports = { logSearchHistory };
