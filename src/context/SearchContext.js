import { createContext, useContext, useState } from "react";

const SearchContext = createContext();

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [results, setResults] = useState(null);

  const saveResults = (query, data) => {
    setResults({ query, data });
  };

  const clearResults = () => {
    setResults(null);
  };

  return (
    <SearchContext.Provider value={{ results, saveResults, clearResults }}>
      {children}
    </SearchContext.Provider>
  );
};
