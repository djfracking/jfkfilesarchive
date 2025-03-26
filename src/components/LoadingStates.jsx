import React, { useState, useEffect } from "react";
import "../Website.css";

const LoadingStates = () => {
  const messagesList = [
    "🔍 Scanning documents for relevant words...",
    "🔎 Looking for hidden code names...",
    "📌 Identifying key people, places, and organizations...",
    "📂 Sorting files into relevant categories...",
    "📅 Cross-checking events with historical records...",
    "📖 Finding meaningful phrases and expressions...",
    "🧩 Grouping related documents together...",
    "📊 Highlighting the most relevant information..."
  ];

  const [currentMessage, setCurrentMessage] = useState(messagesList[0]);

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % messagesList.length;
      setCurrentMessage(messagesList[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-states">
      <p className="search-progress fade-in-out">{currentMessage}</p>
      <style>
        {`
          .search-progress {
            opacity: 0;
            transition: opacity 1s ease-in-out;
          }

          .fade-in-out {
            opacity: 1;
          }
        `}
      </style>
    </div>
  );
};

export { LoadingStates };
