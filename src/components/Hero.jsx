import React from "react";
import "./Hero.css";
import SearchBar from "./Searchbar";

const Hero = ({ handleSearch }) => {
  return (
    <section className="hero">
      <div className="hero-overlay">
        <div className="hero-content">
          <h1>JFK Assassination Files</h1>
          <p>68,000 AI-Scanned 2025 JFK Assassination Records.</p>
          <SearchBar handleSearch={handleSearch} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
