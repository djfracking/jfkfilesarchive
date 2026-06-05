import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import "./SearchResults.css";
import { LoadingStates } from "../components/LoadingStates";
import SearchItem from "../components/SearchItem";

const RESULTS_PER_PAGE = 20;

const docIdFromResult = (result) => {
  const name = result?.name || result?.objectID || "";
  return name.replace(/\.(pdf|txt)$/i, "");
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("page"), 10) || 1;
  const [currentQuery, setCurrentQuery] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState("");
  const [corrected, setCorrected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentQuery(queryParam);

    if (queryParam.trim().length < 2) {
      setResults([]);
      setSummary("");
      setCorrected([]);
      setError("");
      setLoading(false);
      return;
    }

    let ignore = false;
    const runSearch = async () => {
      setLoading(true);
      setError("");

      try {
        const mainSearch = httpsCallable(functions, "mainSearch");
        const response = await mainSearch({ query: queryParam.trim() });
        if (ignore) return;

        const data = response.data || {};
        setResults(Array.isArray(data.results) ? data.results : []);
        setCorrected(Array.isArray(data.corrected) ? data.corrected : []);
        setSummary(data.message || "");
      } catch (err) {
        if (ignore) return;
        console.error("Firebase search failed:", err);
        setResults([]);
        setSummary("");
        setCorrected([]);
        setError("Search is temporarily unavailable. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    runSearch();

    return () => {
      ignore = true;
    };
  }, [queryParam]);

  const pagedResults = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    return results.slice(start, start + RESULTS_PER_PAGE);
  }, [results, currentPage]);

  const totalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newQuery = e.target.elements.query.value.trim();
    if (newQuery) {
      navigate(`/search?q=${encodeURIComponent(newQuery)}&page=1`);
    }
  };

  const goToPage = (page) => {
    navigate(`/search?q=${encodeURIComponent(queryParam)}&page=${page}`);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearchSubmit} className="search-bar">
        <input
          type="search"
          name="query"
          placeholder="Search the archives..."
          value={currentQuery}
          enterKeyHint="search"
          onChange={(e) => setCurrentQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading && <LoadingStates searchStage="Searching..." />}
      {error && <p className="search-error">{error}</p>}

      {!loading && !error && queryParam && (
        <>
          <div className="results-summary">
            {summary || `${results.length} result${results.length === 1 ? "" : "s"} found.`}
            {corrected.length > 0 && (
              <span className="corrected-terms"> Matched terms: {corrected.join(", ")}</span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="no-results">No results found for "{queryParam}"</div>
          ) : (
            <div className="results-list">
              {pagedResults.map((result) => {
                const objectID = docIdFromResult(result);
                return (
                  <SearchItem
                    key={objectID}
                    objectID={objectID}
                    algoliaTitle={objectID}
                    algoliaDescription={`Score: ${Math.round(result.score || 0)}`}
                  />
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
