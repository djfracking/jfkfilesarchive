import React from "react";
import "../Website.css";

const Terms = () => {
  return (
    <div className="terms-container">
      <h1>Terms of Service</h1>
      <p>Last updated: August 6, 2024</p>

      <p>
        Welcome to the JFK Files Archive. This project is an open-source, educational tool designed to help people explore declassified historical records.
      </p>

      <h2>1. Be Cool</h2>
      <p>
        By using this site, you agree to use it respectfully. That means no harassment, no hate speech, no spam, no abuse of the tools provided here. Don’t be a troll.
      </p>

      <h2>2. Educational Use Only</h2>
      <p>
        The content on this site is for commentary, research, and educational purposes. We are not affiliated with any government agency, and we do not claim ownership over public records.
      </p>

      <h2>3. Open Source, No Guarantees</h2>
      <p>
        This site is built and maintained by volunteers and contributors. It may go down sometimes. It may change. We do our best, but we can’t make any guarantees. Use at your own risk.
      </p>

      <h2>4. Respect the Archive</h2>
      <p>
        You may link to and share materials from the archive freely. Please don’t misrepresent them, remix them with malicious intent, or scrape the entire site. 
      </p>

      <h2>5. Privacy & Data</h2>
      <p>
        We don’t collect or sell your personal data. If you sign in, we may store basic metadata to help improve the experience, but we’re not in the surveillance business.
      </p>

      <h2>6. Changes to These Terms</h2>
      <p>
        We might update these terms from time to time. If we do, we’ll note the date above. By continuing to use the site, you accept the updated terms.
      </p>

      <p style={{ marginTop: "2rem", fontStyle: "italic" }}>
        Thanks for being here. Stay curious, stay respectful.
      </p>
    </div>
  );
};

export default Terms;
