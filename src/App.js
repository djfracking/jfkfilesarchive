import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './Website.css';

// Import page components
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Methods from "./pages/Methods";
import Leaderboard from './pages/Leaderboard';
import DocPage from './pages/DocPage';
import SearchResults from './pages/SearchResults';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Bookmarks from './pages/Bookmarks';

// Import Header and Footer
import Header from "./components/Header";
import Footer from "./components/Footer";

// 🔥 Import Search Context Provider
import { SearchProvider } from "./context/SearchContext";
import Archives from "./pages/Archives";
import GroupArchivePage from "./pages/GroupArchivePage";

import CodeWordsAdmin from "./pages/Codewords";
import CategoryDocListPage from "./pages/CategoryDocListPage";

function App() {
  return (
    <Router>
      <SearchProvider>
        <div>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/methods" element={<Methods />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/doc/:id" element={<DocPage />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/archive" element={<Archives />} />
              <Route path="/archive/:groupName" element={<GroupArchivePage />} />
              <Route path="/archive/:groupName/:categoryName" element={<CategoryDocListPage />} />
              <Route path="/codewords" element={<CodeWordsAdmin />} />
              
            </Routes>
          </main>
          <Footer />
        </div>
      </SearchProvider>
    </Router>
  );
}

export default App;
