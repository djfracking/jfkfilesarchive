const { fetchFromWordIndex } = require("./fetchers/wordIndex");
// const { fetchFromCategoriesIndex } = require("./fetchers/categoriesIndex");
const { fetchFromCodeWordsIndex } = require("./fetchers/codeWordsIndex");
const { fetchFromGroupsIndex } = require("./fetchers/groupsIndex");
const { fetchFromNgramIndex } = require("./fetchers/ngramIndex");
const { fetchFromTimeLineIndex } = require("./fetchers/timeLineIndex");
const { fetchFromTitlesAndDescriptions } = require("./fetchers/titlesAndDescriptions");

const { aggregateAndRankResults } = require("./ranker");

const fetchers = {
  word_index: { fn: fetchFromWordIndex, mode: "token" },
  // categoriesIndex: { fn: fetchFromCategoriesIndex, mode: "token" },
  code_words: { fn: fetchFromCodeWordsIndex, mode: "token" },
  groupsIndex: { fn: fetchFromGroupsIndex, mode: "token" },
  ngram_index: { fn: fetchFromNgramIndex, mode: "raw" },
  timeLineIndex: { fn: fetchFromTimeLineIndex, mode: "token" },
  // nameEntityIndex: { fn: fetchFromNameEntityIndex, mode: "token" },
  // historicalSearchIndex: { fn: fetchFromHistoricalSearchIndex, mode: "token" },
  titlesAndDescriptions: { fn: fetchFromTitlesAndDescriptions, mode: "token" },
};

async function searchIndexes({ tokens, rawQuery }) {
  const results = [];
  const correctedWords = [];

  console.time("[TOTAL] searchIndexes");

  // Process each token using fetchers with mode "token"
  for (const token of tokens) {
    console.log(`🔍 Token: "${token}"`);
    const fetchPromises = Object.entries(fetchers)
      .filter(([, { mode }]) => mode === "token")
      .map(async ([indexName, { fn }]) => {
        const label = `[${indexName}] Fetching "${token}"`;
        console.time(label);
        try {
          const match = await fn(token);
          if (match) {
            console.log(`Document from ${indexName}:`, match);
            console.timeEnd(label);
            return { ...match, index: indexName };
          }
        } catch (err) {
          console.error(`❌ Error in fetcher "${indexName}" for token "${token}":`, err.message);
        }
        console.timeEnd(label);
        return null;
      });

    const tokenMatches = await Promise.all(fetchPromises);
    for (const match of tokenMatches.filter(Boolean)) {
      results.push(match);
      correctedWords.push(match.word);
    }
  }

  // Process raw query using fetchers with mode "raw"
  console.time("[RAW QUERY FETCHERS]");
  const rawFetchPromises = Object.entries(fetchers)
    .filter(([, { mode }]) => mode === "raw")
    .map(async ([indexName, { fn }]) => {
      const label = `[${indexName}] Fetching rawQuery "${rawQuery}"`;
      console.time(label);
      try {
        const match = await fn(rawQuery);
        if (match) {
          console.log(`Document from ${indexName} (raw query):`, match);
          console.timeEnd(label);
          return { ...match, index: indexName };
        }
      } catch (err) {
        console.error(`❌ Error in fetcher "${indexName}" for rawQuery:`, err.message);
      }
      console.timeEnd(label);
      return null;
    });

  const rawMatches = await Promise.all(rawFetchPromises);
  for (const match of rawMatches.filter(Boolean)) {
    results.push(match);
    correctedWords.push(match.word);
  }
  console.timeEnd("[RAW QUERY FETCHERS]");

  // Aggregate and rank all results to maximize the final output
  console.time("[Ranking Results]");
  const rankedResults = aggregateAndRankResults(results);
  console.timeEnd("[Ranking Results]");

  console.log("Aggregated and ranked documents:", rankedResults);
  console.timeEnd("[TOTAL] searchIndexes");

  // Log all documents grouped by index
  const docsByIndex = results.reduce((acc, doc) => {
    if (!acc[doc.index]) {
      acc[doc.index] = [];
    }
    acc[doc.index].push(doc);
    return acc;
  }, {});
  console.log("Documents grouped by index:", docsByIndex);

  return { corrected: [...new Set(correctedWords)], results: rankedResults };
}

module.exports = { searchIndexes };
