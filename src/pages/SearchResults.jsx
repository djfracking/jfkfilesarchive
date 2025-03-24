import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
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

import "./SearchResults.css";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const [thumbnailsMap, setThumbnailsMap] = useState({});
  const [thumbnailIndexes, setThumbnailIndexes] = useState({});
  const [docStats, setDocStats] = useState({});
  const [docTitles, setDocTitles] = useState({});
  const [docDescriptions, setDocDescriptions] = useState({});

  const navigate = useNavigate();
  const app = getApp();
  const functions = getFunctions(app);
  const db = getFirestore(app);

  // Load cached results if available, otherwise, fetch new data
  useEffect(() => {
    const cachedResults = sessionStorage.getItem(`${queryParam}-${currentPage}`);
    
    if (cachedResults) {
      const parsedResults = JSON.parse(cachedResults);
      const now = Date.now();
    
      if (parsedResults.expiry && now < parsedResults.expiry) {
        // Cache is still valid
        setResults({ query: parsedResults.query, data: parsedResults.data });
    
        if (parsedResults.metadata) {
          setThumbnailsMap(parsedResults.metadata.thumbnailsMap || {});
          setThumbnailIndexes(parsedResults.metadata.thumbnailIndexes || {});
          setDocStats(parsedResults.metadata.docStats || {});
          setDocTitles(parsedResults.metadata.docTitles || {});
          setDocDescriptions(parsedResults.metadata.docDescriptions || {});
        }
    
        setLoading(false);
        return; // Early exit
      } else {
        // Expired — clear and fetch fresh
        sessionStorage.removeItem(`${queryParam}-${currentPage}`);
      }
    }
    
    fetchSearch(queryParam, currentPage);    
    
  }, [queryParam, currentPage]);

  // Update the current page in state when the page parameter changes
  useEffect(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    setCurrentPage(page);
  }, [searchParams]);

  const fetchSearch = async (q, page = 1) => {

    try {
      setLoading(true);
      setError(null);

      const searchFn = httpsCallable(functions, "mainSearch");
      const result = await searchFn({ query: q, page });

      // Ensure metadata like titles, descriptions, and votes are included
      const data = result.data;
      setResults({ query: q, data });
      setCurrentPage(page);
      setTotalPages(data.totalPages || 1);

      const meta = await fetchMetaForResults(data.results);

      setThumbnailsMap(meta.thumbnailsMap);
      setThumbnailIndexes(meta.thumbnailIndexes);
      setDocStats(meta.docStats);
      setDocTitles(meta.docTitles);
      setDocDescriptions(meta.docDescriptions);

      const timestamp = Date.now();
      const cacheData = {
        query: q,
        data,
        metadata: meta,
        timestamp,
        expiry: timestamp + 10 * 60 * 1000, // expires in 10 minutes
      };
      sessionStorage.setItem(`${q}-${page}`, JSON.stringify(cacheData));
      

    } catch (err) {
      console.error("Search failed:", err.message);
      setError("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetaForResults = async (docResults) => {
    const thumbnailMap = {};
    const indexMap = {};
    const statsMap = {};
    const titleMap = {};
    const descriptionMap = {};

    for (const docResult of docResults) {
      const filename = docResult.name.replace(".txt", "");
      const docRef = doc(db, "2025JFK", filename);
      const docSnap = await getDoc(docRef);

      let views = 0;
      let title = "";
      let description = "";
      let votes = { up: 0, down: 0 };
      let commentCount = 0;

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.thumbnails) {
          thumbnailMap[filename] = data.thumbnails;
          indexMap[filename] = 0;
        }
        views = typeof data.views === "number" && !isNaN(data.views) ? data.views : 0;
        title = data.title || "Untitled";
        description = data.description || "";

        const votesRef = collection(db, "docVotes");
        const commentsRef = collection(db, "comments");
        const commentsQuery = query(commentsRef, where("docId", "==", filename));
        const commentsSnap = await getDocs(commentsQuery);
        commentCount = commentsSnap.size;

        
        const viewsRef = doc(db, "2025JFK", filename);

        const votesSnap = await getDocs(query(votesRef, where("docId", "==", filename)));
        const voteData = { up: 0, down: 0 };
        votesSnap.forEach((voteDoc) => {
          const vote = voteDoc.data();
          if (vote.type === "up") voteData.up++;
          if (vote.type === "down") voteData.down++;
        });
        votes = voteData;


        const viewsSnap = await getDoc(viewsRef);
        if (viewsSnap.exists()) {
          const viewsData = viewsSnap.data();
          views = viewsData.views || 0;
        }
      }

      titleMap[filename] = title;
      descriptionMap[filename] = description;
      statsMap[filename] = { views, votes, comments: commentCount };
    }

    return {
      thumbnailsMap: thumbnailMap,
      thumbnailIndexes: indexMap,
      docStats: statsMap,
      docTitles: titleMap,
      docDescriptions: descriptionMap,
    };
    
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newQuery = e.target.elements.query.value.trim();
    if (newQuery) {
      navigate(`/search?q=${encodeURIComponent(newQuery)}&page=1`);
    }
  };

  const handleThumbnailNav = (docName, direction) => {
    const max = thumbnailsMap[docName]?.length || 0;
    setThumbnailIndexes((prev) => {
      const currentIndex = prev[docName] || 0;
      const newIndex = (currentIndex + direction + max) % max;
      return { ...prev, [docName]: newIndex };
    });
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearchSubmit} className="search-bar">
        <input type="text" name="query" placeholder="Search again..." defaultValue={queryParam} />
        <button type="submit">Search</button>
      </form>

      {loading && <p>🔍 Searching...</p>}
      {error && <p>{error}</p>}

      {!loading && results && results.data && (
        <>
          <p className="results-summary">
            {results.data.totalFound} results for "<strong>{queryParam}</strong>" (Page {currentPage} of {totalPages})
          </p>

          <div className="results-list">
            {results.data.results.map((docResult) => {
              const filename = docResult.name.replace(".txt", "");
              const thumbnails = thumbnailsMap[filename] || [];
              const currentIndex = thumbnailIndexes[filename] || 0;
              const stats = docStats[filename] || {};
              const { views = 0, votes = { up: 0, down: 0 }, comments = 0 } = stats;
              const title = docTitles[filename] || "Untitled";
              const description = docDescriptions[filename] || "";

              return (
                  <div
                    className="result-item clickable"
                    key={filename}
                    onClick={() => navigate(`/doc/${filename}`)}
                  >
                  <div className="result-left">
                    <a href={`/doc/${filename}`} className="doc-title">
                      {title}
                    </a>
                    <div className="doc-description">
                     {description}                   
                     </div>
                    <div className="doc-meta">
                      <span>📁 2025JFK</span>
                      <p><strong>Views:</strong> {views}</p>
                      <p><strong>Votes:</strong> {votes.up} up / {votes.down} down</p>
                      <p><strong>Comments:</strong> {comments} comments</p>
                    </div>
                  </div>

                  {thumbnails.length > 0 && (
                    <div className="thumbnail-viewer">
                      <img src={thumbnails[currentIndex]} alt={`Thumbnail for ${filename}`} />
                      <button
                        className="nav-button"
                        onClick={(e) => {
                          e.stopPropagation(); // ⛔ Prevents parent onClick
                          handleThumbnailNav(filename, -1);
                        }}
                      >
                        ◀
                      </button>
                      <button
                        className="nav-button"
                        onClick={(e) => {
                          e.stopPropagation(); // ⛔ Prevents parent onClick
                          handleThumbnailNav(filename, 1);
                        }}
                      >
                        ▶
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              {currentPage > 1 && (
                <button onClick={() => navigate(`/search?q=${encodeURIComponent(queryParam)}&page=${currentPage - 1}`)}>
                  ◀ Previous
                </button>
              )}
              <span>
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <button onClick={() => navigate(`/search?q=${encodeURIComponent(queryParam)}&page=${currentPage + 1}`)}>
                  Next ▶
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
