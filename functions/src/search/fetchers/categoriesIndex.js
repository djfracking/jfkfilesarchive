const admin = require("firebase-admin");
const { closest, distance } = require("fastest-levenshtein");

const db = admin.firestore();

async function fetchFromCategoryIndex(word) {
  const wordLower = word.toLowerCase();

  // 🔍 Check for exact match first
  const exactDoc = await db.collection("categoriesIndex").doc(word).get();
  if (exactDoc.exists) {
    const data = exactDoc.data();
    return {
      word,
      files: data.doc_ids || [],
      originalCategory: data.original_category || word,
      corrected: false
    };
  }

  // 🔎 Fuzzy match against all category doc IDs
  const allDocs = await db.collection("categoriesIndex").listDocuments();
  const allCategoryNames = allDocs.map(doc => doc.id);
  
  const best = closest(wordLower, allCategoryNames.map(c => c.toLowerCase()));
  const originalMatch = allCategoryNames.find(c => c.toLowerCase() === best);

  if (originalMatch && distance(wordLower, best) <= 2) {
    const fuzzyDoc = await db.collection("categoriesIndex").doc(originalMatch).get();
    const data = fuzzyDoc.data();
    return {
      word: originalMatch,
      files: data.doc_ids || [],
      originalCategory: data.original_category || originalMatch,
      corrected: true
    };
  }

  return null; // no match
}

module.exports = { fetchFromCategoryIndex };
