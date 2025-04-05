import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import algoliasearch from "algoliasearch/lite";
import "./Hero.css";

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Use your suggestions index
const suggestionsIndexName = "2025JFK_export_query_suggestions";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  // When the input changes, fetch suggestions from Algolia
  const handleInputChange = async (event) => {
    const value = event.target.value;
    setSearchQuery(value);

    if (value.length >= 2) {
      try {
        const index = searchClient.initIndex(suggestionsIndexName);
        const { hits } = await index.search(value, { hitsPerPage: 5 });
        // Assume each suggestion hit has a "query" attribute.
        setSuggestions(hits.map((hit) => hit.query));
        console.log(suggestions)
      } catch (err) {
        console.error("Error fetching suggestions from Algolia:", err);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
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
          type="search"
          placeholder="Search the archives..."
          value={searchQuery}
          onChange={handleInputChange}
          className="search-input"
          enterKeyHint="search"
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="preDictList">
          <ul className="suggestions-list">
            {suggestions.map((term, index) => (
              <li
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(term)}
                style={{ cursor: "pointer" }}
              >
                <span style={{ flex: 1 }}>{term}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
