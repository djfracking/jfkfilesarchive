import React, { useEffect, useState } from "react";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  Pagination,
  Configure,
  Stats,
  connectHits
} from "react-instantsearch-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./SearchResults.css";
import { LoadingStates } from "../components/LoadingStates"; // Adjust path if needed
import SearchItem from "../components/SearchItem"; // Ensure this is a default export
import { connectStateResults } from "react-instantsearch-dom";

// Initialize the Algolia client using env variables.
const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Define index names.
const hitsIndex = "2025JFK_export";
const suggestionsIndex = "2025JFK_export_query_suggestions";

// Connected Hits: render each hit using SearchItem.
const CustomHits = connectHits(({ hits }) => (
  <div className="results-list">
    {hits.map((hit) => (
      <SearchItem
        key={hit.objectID}
        objectID={hit.objectID}
        algoliaTitle={hit.title}
        algoliaDescription={hit.description}
      />
    ))}
  </div>
));

// Custom QuerySuggestions component that fetches suggestions directly from Algolia.
const QuerySuggestions = ({ currentQuery, onSelectSuggestion, indexName }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (currentQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const index = searchClient.initIndex(indexName);
    index
      .search(currentQuery, { hitsPerPage: 5 })
      .then(({ hits }) => {
        // Expect each hit to have a "query" attribute.
        setSuggestions(hits.map((hit) => hit.query));
      })
      .catch(() => {
        setSuggestions([]);
      });
  }, [currentQuery, indexName]);

  if (suggestions.length === 0) return null;

  return (
    <ul className="query-suggestions">
      {suggestions.map((suggestion, idx) => (
        <li key={idx} onClick={() => onSelectSuggestion(suggestion)}>
          {suggestion}
        </li>
      ))}
    </ul>
  );
};

const CustomResults = connectStateResults(({ searchState, searchResults, children }) =>
  searchResults && searchResults.nbHits === 0 ? (
    <div className="no-results">
      No results found for "{searchState.query}"
    </div>
  ) : (
    children
  )
);

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page")) || 1
  );
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const [currentQuery, setCurrentQuery] = useState(queryParam);
  const navigate = useNavigate();

  // Update current page when URL parameters change.
  useEffect(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    setCurrentPage(page);
  }, [searchParams]);

  // Mark loading as false (InstantSearch manages fetching automatically).
  useEffect(() => {
    setLoading(false);
  }, [queryParam, currentPage]);

  // Handle manual search form submission.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newQuery = e.target.elements.query.value.trim();
    if (newQuery) {
      setCurrentQuery(newQuery);
      navigate(`/search?q=${encodeURIComponent(newQuery)}&page=1`);
    }
  };

  // Handle suggestion click.
  const handleSelectSuggestion = (suggestion) => {
    setCurrentQuery(suggestion);
    navigate(`/search?q=${encodeURIComponent(suggestion)}&page=1`);
  };

  return (
    <div className="search-container">
      {/* Manual search form */}
      <form onSubmit={handleSearchSubmit} className="search-bar">
        <input
          type="search"
          name="query"
          placeholder="Search the archives..."
          defaultValue={queryParam}
          enterKeyHint="search"
          onChange={(e) => setCurrentQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {/* Query suggestions */}
      <QuerySuggestions
        currentQuery={currentQuery}
        onSelectSuggestion={handleSelectSuggestion}
        indexName={suggestionsIndex}
      />

      {loading && <LoadingStates searchStage="Loading..." />}
      {error && <p>{error}</p>}

      <InstantSearch key={queryParam} searchClient={searchClient} indexName={hitsIndex}>
        <Configure hitsPerPage={20} query={queryParam} />
        <Stats
          translations={{
            stats(nbHits, timeSpentMS) {
              return `${nbHits} results found in ${timeSpentMS}ms`;
            }
          }}
        />
        <CustomResults>
          <CustomHits />
        </CustomResults>
        <div className="pagination-container">
          <Pagination />
        </div>
      </InstantSearch>

    </div>
  );
};

export default SearchResults;
