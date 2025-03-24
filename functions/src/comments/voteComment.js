const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

const voteComment = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new Error("You must be authenticated to vote.");
  }

  const userId = auth.uid;
  const { commentId, type } = data;

  if (!commentId || typeof commentId !== "string") {
    throw new Error("A valid commentId must be provided.");
  }

  if (type !== "up" && type !== "down") {
    throw new Error("Vote type must be either 'up' or 'down'.");
  }

  const voteId = `${commentId}_${userId}`;
  const voteRef = db.collection("commentVotes").doc(voteId);
  const commentRef = db.collection("comments").doc(commentId);

  const [existingVoteSnap, commentSnap] = await Promise.all([
    voteRef.get(),
    commentRef.get()
  ]);

  if (!commentSnap.exists) {
    throw new Error("Comment not found.");
  }

  const commentData = commentSnap.data();
  const oldVote = existingVoteSnap.exists ? existingVoteSnap.data().type : null;

  const batch = db.batch();

  // Adjust vote counts based on previous and new vote
  if (oldVote === type) {
    // Toggling off same vote → remove vote
    batch.delete(voteRef);
    if (type === "up") {
      batch.update(commentRef, {
        upvotes: admin.firestore.FieldValue.increment(-1),
        voteDelta: admin.firestore.FieldValue.increment(-1),
      });
    } else {
      batch.update(commentRef, {
        downvotes: admin.firestore.FieldValue.increment(-1),
        voteDelta: admin.firestore.FieldValue.increment(1),
      });
    }
  } else {
    // Add or switch vote
    const voteData = {
      commentId,
      userId,
      type,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(voteRef, voteData);

    if (!oldVote) {
      // New vote
      if (type === "up") {
        batch.update(commentRef, {
          upvotes: admin.firestore.FieldValue.increment(1),
          voteDelta: admin.firestore.FieldValue.increment(1),
        });
      } else {
        batch.update(commentRef, {
          downvotes: admin.firestore.FieldValue.increment(1),
          voteDelta: admin.firestore.FieldValue.increment(-1),
        });
      }
    } else {
      // Switching vote
      if (type === "up") {
        batch.update(commentRef, {
          upvotes: admin.firestore.FieldValue.increment(1),
          downvotes: admin.firestore.FieldValue.increment(-1),
          voteDelta: admin.firestore.FieldValue.increment(2),
        });
      } else {
        batch.update(commentRef, {
          downvotes: admin.firestore.FieldValue.increment(1),
          upvotes: admin.firestore.FieldValue.increment(-1),
          voteDelta: admin.firestore.FieldValue.increment(-2),
        });
      }
    }
  }

  await batch.commit();

  console.log(`User ${userId} voted ${type} on comment ${commentId}`);
  return { success: true };
});

module.exports = voteComment;
