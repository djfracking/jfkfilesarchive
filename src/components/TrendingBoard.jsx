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
    for (const docEntry of docs) {
      const docRef = doc(db, "2025JFK", docEntry.docId.replace(".pdf", ""));
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        let title = docSnap.data().title || "Untitled";
        // Clean weird AI generation prefix
        title = title.replace(/^Here is a.*?:/, "").replace(/^"|"$/g, "").trim();
        newTitles[docEntry.docId] = title;
      } else {
        newTitles[docEntry.docId] = "Untitled";
      }
    }
    setTitles(newTitles);
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
          return (
            <li key={doc.docId} className="leaderboard-item">
              <a href={`/doc/${filename}`} target="_blank" rel="noopener noreferrer">
                <span className="rank">#{index + 1}</span>{" "}
                <span className="doc-title">{displayTitle}</span>
              </a>
              <div className="doc-stats">
                👍 {doc.upvotes} &nbsp;&nbsp; 👎 {doc.downvotes} &nbsp;&nbsp;
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Leaderboard;
