const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Scans the "JFK2025" collection for documents whose title or description
 * contain a case-insensitive partial match for the provided phrase.
 *
 * @param {string} phrase - The word or phrase to search for.
 * @returns {Promise<Object|null>} An object with the phrase and matching files, or null if no match.
 */
async function fetchFromTitlesAndDescriptions(phrase) {
  const trimmedPhrase = phrase.trim();
  const lowerPhrase = trimmedPhrase.toLowerCase();
  console.log(`[fetchFromTitlesAndDescriptions] Searching for phrase: "${trimmedPhrase}"`);

  const snap = await db.collection("JFK2025").get();
  const files = [];
  let matchCount = 0;

  snap.forEach((doc) => {
    const data = doc.data();
    const id = doc.id;
    const title = data.title || "";
    const description = data.description || "";

    // Check if the title or description contains the search phrase (case-insensitive)
    if (title.toLowerCase().includes(lowerPhrase) || description.toLowerCase().includes(lowerPhrase)) {
      console.log(
        `[fetchFromTitlesAndDescriptions] Document "${id}" matched. Title: "${title}", Description: "${description}"`
      );
      files.push({ name: id, count: 1 });
      matchCount++;
    } else {
      console.log(`[fetchFromTitlesAndDescriptions] Document "${id}" did not match.`);
    }
  });

  console.log(`[fetchFromTitlesAndDescriptions] Total documents matched: ${matchCount}`);

  if (!files.length) return null;

  return { phrase: trimmedPhrase, files };
}

module.exports = { fetchFromTitlesAndDescriptions };
