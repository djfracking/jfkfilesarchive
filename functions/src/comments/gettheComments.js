const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

const getComments = onCall(async (request) => {
  const { data } = request;
  const { docId } = data;

  if (!docId || typeof docId !== "string") {
    throw new Error("A valid docId must be provided.");
  }

  // Step 1: Get comments for this docId
  const commentSnapshot = await db
    .collection("comments")
    .where("docId", "==", docId)
    .get();

  if (commentSnapshot.empty) {
    return { comments: [] };
  }

  const commentDocs = commentSnapshot.docs;
  const commentIds = commentDocs.map((doc) => doc.id);
  const userIds = [...new Set(commentDocs.map((doc) => doc.data().userId))]; // Unique userIds

  // Step 2: Get all votes for the comments
  const voteSnapshots = await Promise.all(
    commentIds.map((id) =>
      db.collection("commentVotes").where("commentId", "==", id).get()
    )
  );

  // Step 3: Build a vote map
  const voteMap = {};
  voteSnapshots.forEach((snapshot, index) => {
    const commentId = commentIds[index];
    let upvotes = 0;
    let downvotes = 0;

    snapshot.forEach((voteDoc) => {
      const vote = voteDoc.data();
      if (vote.type === "up") upvotes++;
      if (vote.type === "down") downvotes++;
    });

    voteMap[commentId] = {
      upvotes,
      downvotes,
      delta: upvotes - downvotes,
    };
  });

  // Step 4: Fetch user displayName and avatar in parallel
  const userDocs = await Promise.all(
    userIds.map((uid) => db.collection("users").doc(uid).get())
  );

  const userMap = {};
  userDocs.forEach((userDoc) => {
    if (userDoc.exists) {
      const userData = userDoc.data();
      userMap[userDoc.id] = {
        username: userData.username || "Anonymous",
        avatar: userData.photoURL || null,
      };
    }
  });

  // Step 5: Build response with vote + user data
  const commentsWithExtras = commentDocs.map((doc) => {
    const data = doc.data();
    const voteData = voteMap[doc.id] || { upvotes: 0, downvotes: 0, delta: 0 };
    const userData = userMap[data.userId] || {
      username: "Unknown",
      avatar: null,
    };

    return {
      id: doc.id,
      ...data,
      voteDelta: voteData.delta,
      upvotes: voteData.upvotes,
      downvotes: voteData.downvotes,
      username: userData.username,
      avatar: userData.avatar,
    };
  });

  // Step 6: Sort by voteDelta descending
  commentsWithExtras.sort((a, b) => b.voteDelta - a.voteDelta);

  console.log(`✅ Returned ${commentsWithExtras.length} comments for docId: ${docId}`);
  return { comments: commentsWithExtras };
});

module.exports = getComments;
