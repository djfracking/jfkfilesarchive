const admin = require("firebase-admin");
const db = admin.firestore();
const nlp = require("compromise");  // lightweight NLP library

async function fetchFromNameEntityIndex(searchPhrase) {
  // Use NLP to check if the entire phrase appears to be a named entity.
  const doc = nlp(searchPhrase);
  const people = doc.people().out('array');
  const organizations = doc.organizations().out('array');
  const places = doc.places().out('array');

  if (people.length === 0 && organizations.length === 0 && places.length === 0) {
    console.log(`The phrase "${searchPhrase}" does not appear to be a named entity. Skipping NameEntityIndex search.`);
    return null;
  }

  console.log(`The phrase "${searchPhrase}" appears to be an entity. Proceeding with NameEntityIndex search.`);
  
  const snapshot = await db.collection("nameEntityIndex").get();
  const matchingEntities = [];

  console.log(`Searching for entity matches for phrase: "${searchPhrase}"`);

  for (const docSnap of snapshot.docs) {
    const entityName = docSnap.id;
    console.log(`Checking entity: "${entityName}"`);

    // Use a case-insensitive check against the full phrase
    if (!entityName.toLowerCase().includes(searchPhrase.toLowerCase())) {
      console.log(`Skipping "${entityName}" as it does not include "${searchPhrase}"`);
      continue;
    }
    
    console.log(`Matched entity: "${entityName}"`);

    const data = docSnap.data();
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

  if (!matchingEntities.length) {
    console.log(`No matching entities found for phrase: "${searchPhrase}"`);
    return null;
  }

  // Rank by total score first, then by number of words in the entity name matching the phrase
  const lowerSearch = searchPhrase.toLowerCase();
  matchingEntities.sort((a, b) => {
    const aMatchCount = a.entity.toLowerCase().split(" ").filter(w => w.includes(lowerSearch)).length;
    const bMatchCount = b.entity.toLowerCase().split(" ").filter(w => w.includes(lowerSearch)).length;
    if (b.score !== a.score) return b.score - a.score;
    return bMatchCount - aMatchCount;
  });

  console.log(`Final matching entities for phrase "${searchPhrase}":`, matchingEntities);
  return matchingEntities;
}

module.exports = { fetchFromNameEntityIndex };
