import React from "react";
import { Link } from "react-router-dom";
import "../Website.css";

const Methods = () => (
  <section className="methods-section">
    <div className="methods-overlay">
      <div className="methodsHeader">
      <h2>Methods</h2>
      <p>
        Over 68,000 records were preprocessed and scanned using AI Optical Character Recognition, then Post-Processed, and used to build multiple indexes for intelligent algorithms.
      </p>
      <Link to="/methods" className="button-primary">Explore Methods</Link>
    </div>
    </div>
  </section>
);

export default Methods;
