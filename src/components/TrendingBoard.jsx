import React, { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { functions } from "../firebase";
import { getApp } from "firebase/app";
import "./Leaderboard.css";

const LOCAL_CACHE_KEY = "leaderboardCache";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [titles, setTitles] = useState({});
  const [thumbnails, setThumbnails] = useState({});

  const db = getFirestore(getApp());

  useEffect(() => {
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setLeaderboard(parsed);
        setLoading(false);
        fetchTitles(parsed);
      } catch (err) {
        console.error("Failed to parse cached leaderboard:", err);
      }
    }

    const fetchLeaderboard = async () => {
      try {
        const getLeaderboard = httpsCallable(functions, "getLeaderboard");
        const res = await getLeaderboard();
        const data = res.data?.leaderboard || [];
        setLeaderboard(data);
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data));
        fetchTitles(data); // Fetch titles after leaderboard loads
      } catch (err) {
        console.error("Error fetching leaderboard:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const fetchTitles = async (docs) => {
    const newTitles = {};
    const newThumbnails = {};
  
    for (const docEntry of docs) {
      const docId = docEntry.docId.replace(".pdf", "");
      const docRef = doc(db, "2025JFK", docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        let title = data.title || "Untitled";
        title = title.replace(/^Here is a.*?:/, "").replace(/^"|"$/g, "").trim();
        newTitles[docEntry.docId] = title;
  
        if (Array.isArray(data.thumbnails) && data.thumbnails.length > 0) {
          newThumbnails[docEntry.docId] = data.thumbnails[0]; // First thumbnail
        }
      } else {
        newTitles[docEntry.docId] = "Untitled";
      }
    }
  
    setTitles(newTitles);
    setThumbnails(newThumbnails);
  };
  

  return (
    <div className="leaderboard-container">
      <h2>📊 Most Voted Documents</h2>
      {loading && <p>Loading leaderboard...</p>}
      {!loading && leaderboard.length === 0 && <p>No votes yet.</p>}
      <ul className="leaderboard-list">
        {leaderboard.slice(0, 10).map((doc, index) => {
          const displayTitle = titles[doc.docId] || doc.docId.replace(".pdf", "");
          const filename = doc.docId.replace(".pdf", "");
          const thumbnailUrl = thumbnails[doc.docId];

          return (
            <li key={doc.docId} className="leaderboard-item">
              <div>
                <a href={`/doc/${filename}`} target="_blank" rel="noopener noreferrer">
                  <span className="rank">#{index + 1}</span>{" "}
                  <span className="doc-title">{displayTitle}</span>
                </a>
                <div className="doc-stats">
                  👍 {doc.upvotes} &nbsp;&nbsp; 👎 {doc.downvotes}
                </div>
              </div>
              {thumbnailUrl && (
                <img src={thumbnailUrl} alt={`Thumbnail for ${filename}`} className="thumbnail" />
              )}
            </li>
          );
        })}
      </ul>

    </div>
  );
};

export default Leaderboard;
