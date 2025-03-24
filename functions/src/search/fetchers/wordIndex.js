const admin = require("firebase-admin");
const db = admin.firestore();

async function fetchFromWordIndex(word) {
  const normalized = word.trim().toLowerCase();
  console.log(`[fetchFromWordIndex] normalized lookup key: "${normalized}"`);

  try {
    const snapshot = await db
      .collection("word_index")
      .where("word", "==", normalized)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const files = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (Array.isArray(data.files)) {
        files.push(...data.files);
      }
    });

    return { word: normalized, files };
  } catch (error) {
    console.error(`[fetchFromWordIndex] error fetching "${normalized}":`, error);
    return null;
  }
}

module.exports = { fetchFromWordIndex };
