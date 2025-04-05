// ../components/SearchItem.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import "../Website.css"; // Ensure your website.css is in the same directory or adjust the path accordingly

/**
 * SearchItem renders a single search result.
 * It fetches metadata from Firestore for the given document (using objectID),
 * falls back to provided Algolia data if missing, and displays thumbnail navigation.
 *
 * Props:
 * - objectID: the unique identifier (Firestore doc id / Algolia objectID)
 * - algoliaTitle: title passed from Algolia (optional)
 * - algoliaDescription: description from Algolia (optional)
 * - onThumbnailNav: function(objectID, direction) to handle thumbnail navigation
 */
const SearchItem = ({ objectID, algoliaTitle, algoliaDescription, onThumbnailNav }) => {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({
    title: algoliaTitle || "Untitled",
    description: algoliaDescription || "",
    views: 0,
    votes: { up: 0, down: 0 },
    commentCount: 0,
    thumbnails: [],
    thumbnailIndex: 0,
  });

  // derive “baseID” by chopping off anything after “_part”
  const baseID = objectID.split("_part")[0];

  const handleClick = () => {
    navigate(`/doc/${baseID}`);
  };


  const app = getApp();
  const db = getFirestore(app);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const docRef = doc(db, "2025JFK", objectID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedTitle = data.title || algoliaTitle || "Untitled";
          const fetchedDescription = data.description || algoliaDescription || "";
          const views = typeof data.views === "number" ? data.views : 0;
          const thumbnails = data.thumbnails || [];

          // Fetch votes from the "docVotes" collection
          const votesRef = collection(db, "docVotes");
          const votesQuery = query(votesRef, where("docId", "==", objectID));
          const votesSnap = await getDocs(votesQuery);
          let votesUp = 0, votesDown = 0;
          votesSnap.forEach((voteDoc) => {
            const vote = voteDoc.data();
            if (vote.type === "up") votesUp++;
            if (vote.type === "down") votesDown++;
          });

          // Fetch comments from the "comments" collection
          const commentsRef = collection(db, "comments");
          const commentsQuery = query(commentsRef, where("docId", "==", objectID));
          const commentsSnap = await getDocs(commentsQuery);
          const commentCount = commentsSnap.size;

          setMeta({
            title: fetchedTitle,
            description: fetchedDescription,
            views,
            votes: { up: votesUp, down: votesDown },
            commentCount,
            thumbnails,
            thumbnailIndex: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching metadata for", objectID, error);
      }
    };

    fetchMetadata();
  }, [db, objectID, algoliaTitle, algoliaDescription]);


  return (
    <div className="result-item clickable" onClick={handleClick}>
      <div className="result-left">
      <a href={`/doc/${baseID}`} className="doc-title">
        {meta.title}
      </a>

        <div className="doc-description">{meta.description}</div>
        <div className="doc-meta">
          <span>📁 2025JFK</span>
          <p><strong>Views:</strong> {meta.views}</p>
          <p>
            <strong>Votes:</strong> {meta.votes.up} up / {meta.votes.down} down
          </p>
          <p><strong>Comments:</strong> {meta.commentCount} comments</p>
        </div>
      </div>
      {meta.thumbnails.length > 0 && (
        <div className="thumbnail-viewer">
          <img
            src={meta.thumbnails[meta.thumbnailIndex]}
            alt={`Thumbnail for ${objectID}`}
          />
          <button
            className="nav-button"
            onClick={(e) => {
              e.stopPropagation();
              onThumbnailNav(objectID, -1);
            }}
          >
            ◀
          </button>
          <button
            className="nav-button"
            onClick={(e) => {
              e.stopPropagation();
              onThumbnailNav(objectID, 1);
            }}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchItem;
