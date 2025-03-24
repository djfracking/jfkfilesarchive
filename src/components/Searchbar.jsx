import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getApp } from "firebase/app";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";
import { deleteDoc, doc } from "firebase/firestore";

import "./Hero.css";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const app = getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, [auth]);

  const handleInputChange = async (event) => {
    const value = event.target.value.toLowerCase();
    setSearchQuery(value);
  
    if (value.length >= 2) {
      const ref = collection(db, "historicalSearchIndex");
      const snapshot = await getDocs(ref);
  
      const filtered = snapshot.docs
        .map((doc) => doc.id)
        .filter((term) => term.startsWith(value))
        .slice(0, 5); // limit suggestions
  
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };
  
  const handleDeleteSuggestion = async (term) => {
    try {
      await deleteDoc(doc(db, "historicalSearchIndex", term));
      setSuggestions((prev) => prev.filter((t) => t !== term));
    } catch (err) {
      console.error("Failed to delete suggestion:", err);
    }
  };
  

  const handleSuggestionClick = (term) => {
    setSearchQuery(term);
    setSuggestions([]);
    navigate(`/search?q=${encodeURIComponent(term)}&page=1`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}&page=1`);
    }
  };

  return (
    <div className="search-wrapper">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          placeholder="Search the archives..."
          value={searchQuery}
          onChange={handleInputChange}
          className="search-input"
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>
  
      {suggestions.length > 0 && (
        <div className="preDictList">
          <ul className="suggestions-list">
            {suggestions.map((term, index) => (
              <li onClick={() => handleSuggestionClick(term)}
              key={index} className="suggestion-item">
                <span
                  style={{ flex: 1, cursor: "pointer" }}
                >
                  {term}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSuggestion(term);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#aaa",
                    cursor: "pointer",
                    marginLeft: "10px",
                  }}
                  aria-label={`Remove ${term}`}
                >
                  ❌
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
  
    </div>
  );
};

export default SearchBar;
