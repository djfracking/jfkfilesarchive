import React from "react";
import "../Website.css";

const Privacy = () => {
  return (
    <div className="privacy-container">
      <h1>Privacy Policy</h1>
      <p>Last updated: August 6, 2024</p>

      <p>
        We respect your privacy. This website is built for educational exploration — not for surveillance, profiling, or ad targeting.
      </p>

      <h2>1. What We Collect</h2>
      <p>
        If you sign up or sign in, we may collect:
      </p>
      <ul>
        <li>Your email address</li>
        <li>Your username</li>
        <li>An avatar image if you upload one</li>
        <li>Your authentication status (e.g. signed in anonymously or via Google)</li>
      </ul>

      <p>
        This data is used only to personalize your experience — never to advertise or sell to you.
      </p>

      <h2>2. What We Don’t Do</h2>
      <ul>
        <li>We don’t sell your data.</li>
        <li>We don’t track your browsing habits across the web.</li>
        <li>We don’t show ads or use third-party trackers.</li>
      </ul>

      <h2>3. Anonymous Users</h2>
      <p>
        You can use this site anonymously. We’ll assign you a random username, but we won’t link it to any personal data unless you choose to sign up.
      </p>

      <h2>4. Storage & Security</h2>
      <p>
        User data is stored using Firebase, which handles secure authentication and database storage. All access is encrypted and limited to necessary functions only.
      </p>

      <h2>5. Cookies</h2>
      <p>
        We use minimal cookies, primarily to keep you signed in. We don’t use cookies for tracking or advertising.
      </p>

      <h2>6. Changes</h2>
      <p>
        This policy may be updated. If we make any major changes, we’ll post the date here at the top.
      </p>

      <p style={{ marginTop: "2rem", fontStyle: "italic" }}>
        If you have questions or concerns, just reach out via djfracking.org.
      </p>
    </div>
  );
};

export default Privacy;
