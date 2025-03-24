const admin = require("firebase-admin");
const db = admin.firestore();

async function fetchFromNameEntityIndex(searchWord) {
  const snapshot = await db.collection("nameEntityIndex").get();

  const matchingEntities = [];

  for (const doc of snapshot.docs) {
    const entityName = doc.id;

    if (!entityName.toLowerCase().includes(searchWord.toLowerCase())) continue;

    const data = doc.data();
    const labels = data.labels || {};

    let totalScore = 0;
    const fileScores = {};

    for (const label of Object.values(labels)) {
      for (const [file, count] of Object.entries(label)) {
        totalScore += count;
        fileScores[file] = (fileScores[file] || 0) + count;
      }
    }

    if (totalScore > 0) {
      matchingEntities.push({
        entity: entityName,
        score: totalScore,
        files: Object.entries(fileScores).map(([name, count]) => ({ name, count }))
      });
    }
  }

  if (!matchingEntities.length) return null;

  // Rank by score first, then by how many words the name has that match the query
  const lowerSearch = searchWord.toLowerCase();

  matchingEntities.sort((a, b) => {
    const aMatchCount = a.entity.toLowerCase().split(" ").filter(w => w.includes(lowerSearch)).length;
    const bMatchCount = b.entity.toLowerCase().split(" ").filter(w => w.includes(lowerSearch)).length;

    if (b.score !== a.score) return b.score - a.score;
    return bMatchCount - aMatchCount;
  });

  return matchingEntities;
}

module.exports = { fetchFromNameEntityIndex };
