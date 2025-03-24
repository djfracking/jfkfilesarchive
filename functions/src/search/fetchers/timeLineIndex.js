const admin = require("firebase-admin");

const db = admin.firestore();

async function fetchFromTimeLineIndex(word) {
  const doc = await db.collection("timeLineIndex").doc(word).get();
  if (!doc.exists) return null;

  const data = doc.data();
  const sources = data.sources || {};

  const files = Object.entries(sources).map(([name, count]) => ({ name, count }));

  if (!files.length) return null;

  return {
    word,
    files,
  };
}

module.exports = { fetchFromTimeLineIndex };
