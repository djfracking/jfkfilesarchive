import React from "react";
import ocrImage from "../assets/OCR.png";
import googleVisionImage from "../assets/googlevision.png";
import "../Website.css";
import "./Methods.css";
import { Helmet } from 'react-helmet';

const Methods = () => {
  return (
    <section className="methods-page">
          <Helmet>
            <title>Methods — How the JFK Files Archive Was Built | JFK Files Archive</title>
            <meta name="description" content="Discover the full technical process behind the JFK Files Archive — from OCR benchmarking and image conversion to multi-layered search index construction." />
            <link rel="canonical" href="https://jfkfilesarchive.com/methods" />

            {/* Open Graph */}
            <meta property="og:type" content="article" />
            <meta property="og:title" content="Methods — How the JFK Files Archive Was Built" />
            <meta property="og:description" content="Explore our step‑by‑step methodology: OCR, indexing, NLP entity extraction, LLM processing, and cloud deployment powering the JFK Files Archive." />
            <meta property="og:url" content="https://jfkfilesarchive.com/methods" />
            <meta property="og:image" content="https://firebasestorage.googleapis.com/v0/b/chatjfkfiles.firebasestorage.app/o/seal.png?alt=media&token=6f179bcc-dcc8-4097-8aa9-028fa435008c" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Methods — How the JFK Files Archive Was Built" />
            <meta name="twitter:description" content="Explore our step‑by‑step methodology: OCR, indexing, NLP entity extraction, LLM processing, and cloud deployment powering the JFK Files Archive." />
            <meta name="twitter:image" content="https://firebasestorage.googleapis.com/v0/b/chatjfkfiles.firebasestorage.app/o/seal.png?alt=media&token=6f179bcc-dcc8-4097-8aa9-028fa435008c" />
          </Helmet>

      <div className="methods-intro">
        <h1>My Methods</h1>
        <p className="mission-statement">
          I'm committed to uncovering the truth about who killed JFK.
          To do that, I had to scan and catalog everything — every memo, every redacted page, every buried lead.
        </p>
      </div>

      <div className="methods-step">
        <h2>Step 1: Benchmarking OCR Engines</h2>
        <p>
          I began by testing leading OCR tools on real pages from the JFK assassination archive. The tools included <strong>EasyOCR</strong>, <strong>Tesseract</strong>, <strong>Adobe OCR</strong>, and <strong>Google Vision OCR</strong>.
          Google Vision delivered the most accurate results, especially on degraded and typewritten government scans.
        </p>
        <img src={ocrImage} alt="OCR Benchmarking" className="methods-image" />
      </div>

      <div className="methods-step">
        <h2>Step 2: Downloading and Converting the Archive</h2>
        <p>
          Using a custom script, I downloaded <strong>2,182 PDFs</strong> from the National Archives at <a href="https://www.archives.gov/research/jfk" target="_blank" rel="noopener noreferrer">archives.gov</a>.
          Each PDF was converted into high-resolution, 600 DPI JPGs — one page per image — resulting in <strong>68,548 images</strong> and over <strong>125 GB</strong> of raw data.
        </p>
      </div>

      <div className="methods-step">
        <h2>Step 3: Google Vision OCR and Text Extraction</h2>
        <p>
          Over the course of a single day, I used the <strong>Google Vision API</strong> to scan every page for text — both printed and handwritten. The raw text extracted formed the base for the searchable index.
        </p>
        <img src={googleVisionImage} alt="Google Vision OCR in action" className="methods-image" />

        <div className="summary-data">
          <h3>OCR Summary</h3>
          <ul>
            <li><strong>Total files processed:</strong> 2,182</li>
            <li><strong>Total words:</strong> 17,122,301</li>
            <li><strong>Total characters (incl. whitespace):</strong> 104,156,911</li>
            <li><strong>Total characters (excl. whitespace):</strong> 86,966,099</li>
            <li><strong>Total lines:</strong> 3,935,195</li>
            <li><strong>Average words per file:</strong> 7,847.07</li>
            <li><strong>Average characters (with spaces):</strong> 47,734.61</li>
            <li><strong>Average characters (no spaces):</strong> 39,856.14</li>
            <li><strong>Average lines per file:</strong> 1,803.48</li>
          </ul>
        </div>
        <p>
          The extracted text was uploaded to Firestore and used to create a layered search index.
        </p>
      </div>

      <div className="methods-step">
        <h2>Step 4: Indexing and Intelligence Layers</h2>
        <p>
          Below is a breakdown of each index powering the JFK search engine:
        </p>

        <div className="index-table-wrapper">
          <table className="index-table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Purpose</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>word_index</strong></td>
                <td>Tracks every word and its frequency across documents.</td>
                <td><em>"rifle"</em> — See where and how often it's mentioned.</td>
              </tr>
              <tr>
                <td><strong>ngram_index</strong></td>
                <td>Captures meaningful 2–4 word phrases for context-aware search.</td>
                <td><em>"Mannlicher Carcano rifle", "CIA safe house"</em></td>
              </tr>
              <tr>
                <td><strong>nameEntityIndex</strong></td>
                <td>Tags names of people, organizations, and places using NLP models.</td>
                <td><em>"Fidel Castro", "Warren Commission"</em></td>
              </tr>
              <tr>
                <td><strong>timeLineIndex</strong></td>
                <td>Maps real dates to document references.</td>
                <td><em>"1963-11-22"</em> — Pull up all docs from the day JFK was killed.</td>
              </tr>
              <tr>
                <td><strong>code_words</strong></td>
                <td>Extracts CIA cryptonyms and operational aliases from context.</td>
                <td><em>"ZRRIFLE", "AM/LASH"</em></td>
              </tr>
              <tr>
                <td><strong>categoryIndex</strong></td>
                <td>Uses a language model to auto-categorize documents by theme.</td>
                <td><em>"Covert Ops", "Diplomatic Communications"</em></td>
              </tr>
              <tr>
                <td><strong>groupsIndex</strong></td>
                <td>Clusters docs into semantic groups and investigative leads.</td>
                <td><em>"Castro assassination plots", "CIA-Oswald surveillance"</em></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          These indexes work together to transform passive reading into active investigation. 
          Search results are pulled from all layers simultaneously and ranked — helping uncover connections no keyword search could reveal.
        </p>

        <p>
          All natural language processing was done locally using <code>spaCy</code> with the <code>en_core_web_trf</code> transformer model, which enabled high-accuracy entity detection and phrase extraction.
          For performance testing and smaller jobs, I also used <code>en_core_web_sm</code>.
        </p>

        <p>
          For intelligence generation — including topics, groups, descriptions, and titles — I ran everything through <strong>Ollama 3</strong>, locally hosted.
          This allowed me to run LLMs at scale without sending any data to external services.
        </p>

        <p>
          I also created a <strong>historicalSearchIndex</strong> to log past queries and power predictive suggestions — making future research faster, more focused, and self-learning.
        </p>
      </div>

      <div className="methods-step">
        <h2>Step 5: Uploading to Firestore and Building the Search Engine</h2>
        <p>
          After generating all indexes locally, I uploaded the structured data into <strong>Firebase Firestore</strong>. Each index — including <code>word_index</code>, <code>ngram_index</code>, <code>nameEntityIndex</code>, and others — was stored as its own Firestore collection.
        </p>

        <p>
          I then created a <strong>Firebase Cloud Function (functionsv2)</strong> that acts as the core search engine. When a query is submitted, the function checks across all indexes in parallel and pulls matching documents from each layer.
        </p>

        <p>
          To rank the results, the function uses a simple scoring algorithm based on the frequency of matches across indexes. Documents mentioned across multiple indexes or with higher term counts are ranked higher in the results.
          This method surfaces documents that are not only relevant but also appear significant across different dimensions — such as name entities, dates, phrases, and code words.
        </p>

        <p>
          All of this runs server-side via Firebase Functions, ensuring that the archive responds in milliseconds while staying fully scalable and secure.
        </p>
      </div>

      <p>
        All indexing, uploading, and model processing was done entirely offline and locally before syncing to the cloud. No proprietary tools, no black-box APIs — just open-source models, Firebase, and a custom-built intelligence engine.
      </p>


    </section>
  );
};

export default Methods;
