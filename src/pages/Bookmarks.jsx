import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import "../Website.css";

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const db = getFirestore();
        const userBookmarksRef = collection(db, "users", user.uid, "bookmarks");
        const q = query(userBookmarksRef, orderBy("addedAt", "desc"));

        try {
          const snapshot = await getDocs(q);
          const docs = snapshot.docs.map((doc) => doc.data());
          setBookmarks(docs);
        } catch (error) {
          console.error("Error fetching bookmarks:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setUserId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading">Loading bookmarks...</div>;
  if (!userId) return <div className="warning">You must be signed in to view bookmarks.</div>;

  return (
    <div className="bookmarks-container">
      <h2>Your Bookmarked Documents</h2>
      {bookmarks.length === 0 ? (
        <p>You haven't bookmarked any documents yet.</p>
      ) : (
        <ul className="bookmark-list">
          {bookmarks.map((doc, idx) => (
            <li key={idx} className="bookmark-item">
              <Link to={`/doc/${doc.docId}`} className="doc-title-link">
                {doc.docId.replace(".pdf", "")}
              </Link>
              <div className="bookmark-meta">
                <span>📁 2025JFK</span>
                <span>🕒 {new Date(doc.addedAt?.toDate?.() || doc.addedAt).toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Bookmarks;
