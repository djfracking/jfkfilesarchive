const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

const editComment = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new Error("User must be authenticated to edit a comment.");
  }

  const userId = auth.uid;
  const { commentId, text } = data;

  if (!commentId || typeof commentId !== "string") {
    throw new Error("A valid commentId must be provided.");
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("A valid comment text must be provided.");
  }

  const commentRef = db.collection("comments").doc(commentId);
  const commentSnap = await commentRef.get();

  if (!commentSnap.exists) {
    throw new Error("Comment not found.");
  }

  const commentData = commentSnap.data();

  if (commentData.userId !== userId) {
    throw new Error("You can only edit your own comments.");
  }

  await commentRef.update({
    text: text.trim(),
    editedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Comment ${commentId} edited by user ${userId}.`);

  return { success: true };
});

module.exports = editComment;
