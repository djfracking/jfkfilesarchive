const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * castVotes - Firebase v2 Callable Function
 * Ensures each user can only vote once per docId.
 * Expects: { docId: string, type: "up" | "down" }
 */
const castVotes = onCall({ timeoutSeconds: 10 }, async (request) => {
  const { docId, type } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new Error("You must be authenticated to vote.");
  }

  if (!docId || typeof docId !== "string") {
    throw new Error("A valid 'docId' must be provided.");
  }

  if (type !== "up" && type !== "down") {
    throw new Error("Vote type must be either 'up' or 'down'.");
  }

  const voteId = `${docId}_${userId}`;
  const voteRef = db.collection("docVotes").doc(voteId);

  // Optional: Check if vote already exists and log it
  const existingVote = await voteRef.get();
  const alreadyVoted = existingVote.exists ? existingVote.data().type : null;

  await voteRef.set({
    docId,
    userId,
    type,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    docId,
    userId,
    type,
    previousVote: alreadyVoted || null,
    message: alreadyVoted
      ? `Vote updated from '${alreadyVoted}' to '${type}'.`
      : `New '${type}' vote recorded.`
  };
});

module.exports =  castVotes ;
