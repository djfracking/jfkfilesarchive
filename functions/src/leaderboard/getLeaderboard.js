const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * getLeaderboard - Callable function to return top 100 docs by net votes
 * It reads all votes from docVotes, aggregates them, and returns sorted results.
 */
const getLeaderboard = onCall({ timeoutSeconds: 15, allowUnauthenticated: true }, async () => {
  const voteSnapshot = await db.collection("docVotes").get();

  const voteCounts = {}; // docId -> { up: 0, down: 0 }

  voteSnapshot.forEach(doc => {
    const { docId, type } = doc.data();
    if (!docId || (type !== "up" && type !== "down")) return;

    if (!voteCounts[docId]) {
      voteCounts[docId] = { up: 0, down: 0 };
    }

    if (type === "up") voteCounts[docId].up += 1;
    if (type === "down") voteCounts[docId].down += 1;
  });

  const leaderboard = Object.entries(voteCounts)
    .map(([docId, { up, down }]) => ({
      docId,
      upvotes: up,
      downvotes: down,
      score: up - down,
      totalVotes: up + down,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 100); // Limit to top 100

  return { leaderboard };
});

module.exports = getLeaderboard;
