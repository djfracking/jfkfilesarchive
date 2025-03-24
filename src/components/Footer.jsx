import React, { useEffect } from "react";
import djFrackingLogo from "../assets/DJFRACKINGLOGO.png";
import "../Website.css";

const Footer = () => {
  useEffect(() => {
    document.title = "JFK Files Archive";
  }, []);

  return (
    <footer className="footer">
      <img src={djFrackingLogo} alt="DJ Fracking Logo" className="footer-logo" />

      <p className="footer-text">
        &copy; {new Date().getFullYear()} JFK Assasination Files Archive. Open Sourced - MIT Licence.
      </p>

      <p className="footer-powered">
        Powered by liquid gold from DJ Fracking. Learn more at{" "}
        <a
          href="https://djfracking.org"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          djfracking.org
        </a>
      </p>

      <p className="footer-disclaimer">
        This website is for educational purposes only. Any assets and government-related imagery are used strictly for commentary and archival reference, and do not imply government affiliation or endorsement.
      </p>

      <div className="footer-legal">
        <a href="/terms" className="footer-link">Terms of Service</a>
        <span className="footer-divider">    |    </span>
        <a href="/privacy" className="footer-link">Privacy Policy</a>
      </div>
    </footer>
  );
};

export default Footer;
