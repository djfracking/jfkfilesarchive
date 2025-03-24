import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import '../pages/DocPage.css';

function TextSearchModal({ docId, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [highlightedText, setHighlightedText] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(null);
  const modalContentRef = useRef(null);

  useEffect(() => {
    const fetchDocText = async () => {
      const db = getFirestore();
      const docRef = doc(db, '2025JFK', docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setOriginalText(data.text || "No extracted text available.");
        setHighlightedText(data.text || "");
      }
    };
    fetchDocText();
  }, [docId]);

  const calculateHighlights = useCallback(() => {
    if (!searchTerm) {
      setHighlightedText(originalText);
      setMatches([]);
      setCurrentMatchIndex(-1);
      setCurrentPage(null);
      return;
    }

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    let matchIndices = [];
    let match;

    while ((match = regex.exec(originalText))) {
      matchIndices.push(match.index);
    }

    let html = '';
    let lastIdx = 0;
    matchIndices.forEach((idx, i) => {
      html += originalText.slice(lastIdx, idx);
      html += `<mark id="match-${i}" class="${i === 0 ? 'active-match' : ''}">${originalText.slice(idx, idx + searchTerm.length)}</mark>`;
      lastIdx = idx + searchTerm.length;
    });
    html += originalText.slice(lastIdx);

    setHighlightedText(html);
    setMatches(matchIndices);
    setCurrentMatchIndex(matchIndices.length ? 0 : -1);
  }, [searchTerm, originalText]);

  useEffect(() => {
    calculateHighlights();
  }, [calculateHighlights]);

  useEffect(() => {
    if (currentMatchIndex >= 0) {
      const el = document.getElementById(`match-${currentMatchIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const textUpToMatch = originalText.slice(0, matches[currentMatchIndex]);
        const pageMarkers = [...textUpToMatch.matchAll(/--- Image [\w-]+_page_(\d+)\.jpeg ---/g)];
        const matchedPage = pageMarkers.length > 0
          ? pageMarkers[pageMarkers.length - 1][1]
          : 'Unknown';
        setCurrentPage(matchedPage);
      }
    }
  }, [currentMatchIndex, matches, originalText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && matches.length) {
      e.preventDefault();
      setCurrentMatchIndex((currentMatchIndex + 1) % matches.length);
    }
  };

  const handleOutsideClick = (e) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const scrollbarMarkers = matches.map((index) => ({
    top: `${(index / originalText.length) * 100}%`
  }));

  return (
    <div className="modal-overlay" onKeyDown={handleKeyDown}>
      <div className="modal-content" ref={modalContentRef}>
        <button className="modal-close-btn-circle" onClick={onClose}></button>
        <h3>Search Document Text</h3>
        <input
          type="text"
          placeholder="Search text... (Press Enter to jump)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {currentPage && matches.length > 0 && (
          <p className="page-number-info">
            📖 Match {currentMatchIndex + 1}/{matches.length} found on page: <strong>{currentPage}</strong>
          </p>
        )}

        <div className="text-container">
          <pre dangerouslySetInnerHTML={{ __html: highlightedText }} />
          {scrollbarMarkers.map((marker, idx) => (
            <div
              key={idx}
              className="scroll-marker"
              style={{ top: marker.top }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TextSearchModal;
