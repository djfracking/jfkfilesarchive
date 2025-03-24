import React from "react";
import coverImage from "../assets/cover.jpg";
import "../Website.css";

const BookPromotion = () => {
  const handleClick = () => {
    if (window.gtag) {
      window.gtag("event", "click", {
        event_category: "Book Promotion",
        event_label: "Buy on Amazon",
        value: 1,
      });
    }
  };

  return (
    <section className="book-support">
      <div className="book-info">
        <h2>Buy My Book</h2>
        <p>
          Support my research and work by purchasing my latest book on the history of cyberattacks. Your support fuels further investigations.
        </p>
        <a
          href="https://www.amazon.com/dp/B0DZ6W8QPL"
          target="_blank"
          rel="noopener noreferrer"
          className="amazon-button"
          onClick={handleClick}
        >
          Buy on Amazon
        </a>
      </div>
      <div className="book-image">
        <img src={coverImage} alt="Book Cover" />
      </div>
    </section>
  );
};

export default BookPromotion;
