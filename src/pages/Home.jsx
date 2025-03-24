import React from "react";
import { Helmet } from "react-helmet";
import Hero from "../components/Hero";
import Leaderboard from "../components/TrendingBoard";
import Methods from "../components/Methods";
import MLK from "../components/MLK";
import BookPromotion from "../components/BookPromotion";
import "../Website.css";

const Home = ({ handleSearch }) => (
  <div>
    <Helmet>
      <title>JFK Files Archive</title>
      <meta name="description" content="Access the complete JFK Files Archive: searchable, indexed presidential documents, memos, and records. Explore thousands of declassified JFK‑era files." />
      <link rel="canonical" href="https://jfkfilesarchive.com/" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="JFK Files Archive — Search, Explore & Research" />
      <meta property="og:description" content="Access the complete JFK Files Archive: searchable, indexed presidential documents, memos, and records." />
      <meta property="og:url" content="https://jfkfilesarchive.com/" />
      <meta property="og:image" content="https://firebasestorage.googleapis.com/v0/b/chatjfkfiles.firebasestorage.app/o/seal.png?alt=media&token=6f179bcc-dcc8-4097-8aa9-028fa435008c" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="JFK Files Archive — Search, Explore & Research" />
      <meta name="twitter:description" content="Access the complete JFK Files Archive: searchable, indexed presidential documents, memos, and records." />
      <meta name="twitter:image" content="https://firebasestorage.googleapis.com/v0/b/chatjfkfiles.firebasestorage.app/o/seal.png?alt=media&token=6f179bcc-dcc8-4097-8aa9-028fa435008c" />
    </Helmet>

    <section id="hero-section">
      <Hero handleSearch={handleSearch} />
    </section>

    <section id="trending-section">
      <Leaderboard />
    </section>

    <section id="methods-section">
      <Methods />
    </section>

    <section id="book-section">
      <BookPromotion />
    </section>

    <section id="mlk-section">
      <MLK />
    </section>
  </div>
);

export default Home;
