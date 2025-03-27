const { tokenize } = require("./tokenizer");
const { searchIndexes } = require("./indexRouter");
const { onCall } = require("firebase-functions/v2/https");
const { logSearchHistory } = require("./utils/logsearchHistory");
const admin = require("firebase-admin");

const db = admin.firestore();

async function mainSearchHandler(query) {
  console.time("[MAIN] Total mainSearchHandler");

  console.time("[TOKENIZE]");
  const tokens = tokenize(query);
  console.timeEnd("[TOKENIZE]");

  console.time("[SEARCH INDEXES]");
  const { corrected, results } = await searchIndexes({ tokens, rawQuery: query });
  console.timeEnd("[SEARCH INDEXES]");

  console.time("[RESULT TRIM]");
  const fullRankedResults = results;
  const topResults = fullRankedResults.slice(0, 20);
  console.timeEnd("[RESULT TRIM]");

  // Compute totals and message for the user.
  const totalFound = fullRankedResults.length;
  const message = `Found ${totalFound} result${totalFound !== 1 ? 's' : ''}. Showing top ${topResults.length}.`;

  const lowerQuery = query.trim().toLowerCase();
  const timestamp = new Date();

  console.time("[SAVE historicalSearchIndex]");
  void db.collection("historicalSearchIndex").doc(lowerQuery).set({
    files: fullRankedResults,
    correctedWords: corrected,
    timestamp,
  }).then(() => {
    console.timeEnd("[SAVE historicalSearchIndex]");
  }).catch(err => {
    console.error("❌ Error saving to historicalSearchIndex:", err.message);
    console.timeEnd("[SAVE historicalSearchIndex]");
  });

  console.time("[LOG SEARCH HISTORY]");
  void logSearchHistory({ query, correctedWords: corrected, topResults })
    .then(() => console.timeEnd("[LOG SEARCH HISTORY]"))
    .catch(err => {
      console.error("❌ Error logging search history:", err.message);
      console.timeEnd("[LOG SEARCH HISTORY]");
    });

  console.timeEnd("[MAIN] Total mainSearchHandler");

  return {
    query,
    corrected,
    results: topResults,
    totalFound,
    totalPages: Math.ceil(totalFound / 20),
    message,
  };
}


const mainSearch = onCall({
  memory: "512MiB",
  timeoutSeconds: 30,
  allowInvalidAppCheckToken: true,
  enforceAppCheck: false,
}, async (request) => {
  const { query } = request.data;
  if (!query || typeof query !== "string" || query.length < 2) {
    throw new Error("Query must be a non-empty string.");
  }

  return await mainSearchHandler(query);
});

module.exports = mainSearch;
