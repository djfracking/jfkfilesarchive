const admin = require("firebase-admin");
const db = admin.firestore();

async function fetchFromCodeWordsIndex(word) {
  const doc = await db.collection("code_words").doc(word).get();
  return doc.exists
    ? { word, files: doc.data().files || [] }
    : null;
}

module.exports = { fetchFromCodeWordsIndex };
