import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy, getDoc, deleteDoc, doc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import "../Website.css";

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [titles, setTitles] = useState({});
  const [thumbnails, setThumbnails] = useState({});

  const db = getFirestore();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userBookmarksRef = collection(db, "users", user.uid, "bookmarks");
        const q = query(userBookmarksRef, orderBy("addedAt", "desc"));

        try {
          const snapshot = await getDocs(q);
          const docs = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
          setBookmarks(docs);
          fetchTitlesAndThumbnails(docs);
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

  const fetchTitlesAndThumbnails = async (docs) => {
    const newTitles = {};
    const newThumbnails = {};

    for (const docEntry of docs) {
      const docRef = doc(db, "2025JFK", docEntry.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const title = data.title || "Untitled";
        newTitles[docEntry.id] = title;

        if (Array.isArray(data.thumbnails) && data.thumbnails.length > 0) {
          newThumbnails[docEntry.id] = data.thumbnails[0]; // First thumbnail
        }
      } else {
        newTitles[docEntry.id] = "Untitled";
      }
    }

    setTitles(newTitles);
    setThumbnails(newThumbnails);
  };

  const handleRemoveBookmark = async (docId) => {
    const docRef = doc(db, "users", userId, "bookmarks", docId);
    try {
      await deleteDoc(docRef);
      setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== docId));
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  if (loading) return <div className="loading">Loading bookmarks...</div>;
  if (!userId) return <div className="warning">You must be signed in to view bookmarks.</div>;

  return (
    <div className="bookmarks-container">
      <h2>Your Bookmarked Documents</h2>
      {bookmarks.length === 0 ? (
        <p>You haven't bookmarked any documents yet.</p>
      ) : (
        <ul className="bookmark-list">
          {bookmarks.map((doc, idx) => {
            const displayTitle = titles[doc.id] || doc.id.replace(".pdf", "");
            const thumbnailUrl = thumbnails[doc.id];

            return (
              <li key={doc.id} className="bookmark-item">
                <div className="bookmark-content">
                  {thumbnailUrl && (
                    <img
                      src={thumbnailUrl}
                      alt={`Thumbnail for ${displayTitle}`}
                      className="thumbnail"
                    />
                  )}
                  <Link to={`/doc/${doc.id}`} className="doc-title-link">
                    <span className="doc-title">{displayTitle}</span>
                  </Link>
                </div>
                <div className="bookmark-meta">
                  <span>📁 2025JFK</span>
                  <span>🕒 {new Date(doc.addedAt?.toDate?.() || doc.addedAt).toLocaleString()}</span>
                </div>
                <button onClick={() => handleRemoveBookmark(doc.id)} className="remove-btn">
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Bookmarks;
