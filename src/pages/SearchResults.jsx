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

// Log environment variables for debugging (remove in production)
console.log("Algolia App ID:", process.env.REACT_APP_ALGOLIA_APP_ID);
console.log("Algolia Search Key:", process.env.REACT_APP_ALGOLIA_SEARCH_KEY);

// Initialize the Algolia client using env variables.
const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Use your index "2025JFK_export" (or "2025JFK" as needed).
const indexName = "2025JFK_export";
console.log("Using Algolia index:", indexName);

// Create a connected hits component that uses SearchItem for each hit.
const CustomHits = connectHits(({ hits }) => {
  console.log("[CustomHits] Received", hits.length, "hits");
  hits.forEach((hit) =>
    console.log("[CustomHits] Rendering hit:", hit.objectID, hit.title)
  );
  return (
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
  );
});

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  console.log("[SearchResults] Query parameter:", queryParam);

  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page")) || 1
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Update current page when URL parameters change.
  useEffect(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    console.log("[SearchResults] Current page changed:", page);
    setCurrentPage(page);
  }, [searchParams]);

  // Log query/page changes and mark loading as false.
  useEffect(() => {
    console.log("[Algolia] Query or page changed:", { queryParam, currentPage });
    setLoading(false);
  }, [queryParam, currentPage]);

  // Manual search form submission handler.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newQuery = e.target.elements.query.value.trim();
    console.log("[SearchResults] New query submitted:", newQuery);
    if (newQuery) {
      navigate(`/search?q=${encodeURIComponent(newQuery)}&page=1`);
    }
  };

  return (
    <div className="search-container">
      {/* Manual search form */}
      <form onSubmit={handleSearchSubmit} className="search-bar">
        <input
          type="search"          
          name="query"
          placeholder="Search again..."
          defaultValue={queryParam}
          enterKeyHint="search"
        />
        <button type="submit">Search</button>
      </form>

      {loading && <LoadingStates searchStage="Loading..." />}
      {error && <p>{error}</p>}

      {/* InstantSearch block handles the search query, stats, hits, and pagination */}
      <InstantSearch key={queryParam} searchClient={searchClient} indexName={indexName}>
        <Configure hitsPerPage={20} query={queryParam} />
        <Stats
          translations={{
            stats(nbHits, timeSpentMS) {
              console.log("[Stats] nbHits:", nbHits, "timeSpentMS:", timeSpentMS);
              return `${nbHits} results found in ${timeSpentMS}ms`;
            }
          }}
        />
        <CustomHits />
        <div className="pagination-container">
          <Pagination />
        </div>
      </InstantSearch>
    </div>
  );
};

export default SearchResults;
