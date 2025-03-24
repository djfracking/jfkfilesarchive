const admin = require("firebase-admin");

const db = admin.firestore();

async function fetchFromNgramIndex(phrase) {
  console.log(`[fetchFromNgramIndex] Called with phrase: "${phrase}"`);
  const tokens = phrase.trim().split(/\s+/);
  const n = tokens.length;
  console.log(`[fetchFromNgramIndex] Token count: ${n}`);

  if (n < 2 || n > 4) {
    console.log(`[fetchFromNgramIndex] Skipping: unsupported token length (${n}). Must be between 2 and 4.`);
    return null;
  }

  const docPath = `ngram_index/${n}/grams/${phrase}`;
  console.log(`[fetchFromNgramIndex] Looking up Firestore document at: ${docPath}`);
  const docRef = db.collection("ngram_index").doc(String(n)).collection("grams").doc(phrase);

  try {
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log(`[fetchFromNgramIndex] No document found for phrase "${phrase}".`);
      return null;
    }

    const data = doc.data();
    console.log(`[fetchFromNgramIndex] Document exists. Raw data:`, data);

    const files = Array.isArray(data.files)
      ? data.files.map(f => ({ name: f.name, count: f.count }))
      : [];

    if (!files.length) {
      console.log(`[fetchFromNgramIndex] Document has no files array or it’s empty.`);
      return null;
    }

    console.log(`[fetchFromNgramIndex] Returning ${files.length} file(s) for phrase "${phrase}".`);
    return { word: phrase, files };
  } catch (err) {
    console.error(`[fetchFromNgramIndex] Error fetching "${phrase}":`, err);
    return null;
  }
}

module.exports = { fetchFromNgramIndex };
