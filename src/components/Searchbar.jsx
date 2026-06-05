import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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
          onChange={(event) => setSearchQuery(event.target.value)}
          className="search-input"
          enterKeyHint="search"
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
