const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

const addComment = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new Error("User must be authenticated to post a comment.");
  }

  const userId = auth.uid;
  const { docId, text } = data;

  if (!docId || typeof docId !== "string") {
    throw new Error("A valid docId must be provided.");
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("A valid comment text must be provided.");
  }

  console.log(`docId: ${docId}, userId: ${userId}`);

  const comment = {
    docId,
    text: text.trim(),
    userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("comments").add(comment);

  return { success: true };
});

module.exports = addComment;
