const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

const voteComment = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new Error("Authentication required.");

  const userId = auth.uid;
  const { commentId, type } = data;
  const voteId = `${commentId}_${userId}`;
  const voteRef = db.collection("commentVotes").doc(voteId);
  const commentRef = db.collection("comments").doc(commentId);

  if (!commentId || (type !== "up" && type !== "down")) {
    throw new Error("Invalid vote request.");
  }

  const [existingVoteSnap, commentSnap] = await Promise.all([
    voteRef.get(),
    commentRef.get()
  ]);

  if (!commentSnap.exists) throw new Error("Comment does not exist.");

  const oldVote = existingVoteSnap.exists ? existingVoteSnap.data().type : null;
  const batch = db.batch();

  // Determine action
  if (oldVote === type) {
    // Toggle off
    batch.delete(voteRef);
    batch.update(commentRef, {
      [`${type}votes`]: admin.firestore.FieldValue.increment(-1),
      voteDelta: admin.firestore.FieldValue.increment(type === "up" ? -1 : 1),
    });
  } else {
    const voteData = { commentId, userId, type, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    batch.set(voteRef, voteData);

    if (oldVote === "up") {
      batch.update(commentRef, {
        upvotes: admin.firestore.FieldValue.increment(-1),
        downvotes: admin.firestore.FieldValue.increment(1),
        voteDelta: admin.firestore.FieldValue.increment(-2),
      });
    } else if (oldVote === "down") {
      batch.update(commentRef, {
        upvotes: admin.firestore.FieldValue.increment(1),
        downvotes: admin.firestore.FieldValue.increment(-1),
        voteDelta: admin.firestore.FieldValue.increment(2),
      });
    } else {
      // New vote
      batch.update(commentRef, {
        [`${type}votes`]: admin.firestore.FieldValue.increment(1),
        voteDelta: admin.firestore.FieldValue.increment(type === "up" ? 1 : -1),
      });
    }
  }

  await batch.commit();
  return { success: true };
});

module.exports = voteComment;
