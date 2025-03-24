const admin = require("firebase-admin");
const { closest, distance } = require("fastest-levenshtein");

const db = admin.firestore();

async function getGroupMatch(word) {
  const doc = await db.collection("groupsIndex").doc(word).get();
  return doc.exists ? { word, files: doc.data().files || [] } : null;
}

async function correctAndFetchGroup(word) {
  const sampleSnap = await db.collection("groupsIndex")
    .orderBy(admin.firestore.FieldPath.documentId())
    .limit(500)
    .get();

  const knownWords = sampleSnap.docs.map(doc => doc.id);
  const best = closest(word, knownWords);

  if (best && distance(word, best) <= 2) {
    const match = sampleSnap.docs.find(d => d.id === best);
    return { word: best, files: match?.data()?.files || [] };
  }

  return null;
}

async function fetchFromGroupsIndex(word) {
  let match = await getGroupMatch(word);
  if (!match) match = await correctAndFetchGroup(word);
  return match;
}

module.exports = { fetchFromGroupsIndex };
