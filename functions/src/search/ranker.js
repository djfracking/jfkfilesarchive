const INDEX_WEIGHTS = {
  word_index: 1,
  ngram_index: 1.3,
  code_words: 1.5,
  categoriesIndex: 1.2,
  groupsIndex: 1.4,
  timeLineIndex: 1,
  nameEntityIndex: 1,
  titlesAndDescriptions: 2,
  historicalSearchIndex: 3,
};

/**
 * Aggregates and ranks files based on overlapping hits across indexes.
 * Logs all intermediate and final results.
 * Returns full sorted list (pagination handled later).
 */

function aggregateAndRankResults(wordResults) {
  console.log("Raw wordResults received:", wordResults);

  const scores = {};
  for (const result of wordResults) {
    const weight = INDEX_WEIGHTS[result.index] || 1;
    console.log(`Processing index "${result.index}" (weight=${weight}) — ${result.files.length} hits`);

    for (const { name, count } of result.files) {
      scores[name] = scores[name] || { name, score: 0, matchCount: 0 };
      scores[name].score += count * weight;
      scores[name].matchCount += 1;
    }
  }

  const sorted = Object.values(scores)
    .sort((a, b) => b.score - a.score || b.matchCount - a.matchCount)
    .slice(0, 20);

  console.log("\n🏆 Top 20 results:", sorted);
  return sorted;
}



module.exports = { aggregateAndRankResults };
