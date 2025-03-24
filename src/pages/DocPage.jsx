import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Comments from '../components/Comments';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  setDoc,
  deleteDoc,
  query,
  collection,
  where,
  getDocs
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown, faBookmark, faEye, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import './DocPage.css';
import { Helmet } from 'react-helmet-async';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  EmailIcon,
} from 'react-share';
import { Document, Page, pdfjs } from 'react-pdf';
import TextSearchModal from '../components/TextSearchModal';

function DocPage() {
  const { id } = useParams();
  const pdfContainerRef = useRef();
  const navigate = useNavigate();

  const db = getFirestore();
  const auth = getAuth();
  const functions = getFunctions();

  const [user, setUser] = useState(null);
  const [views, setViews] = useState(0);
  const [voteMessage, setVoteMessage] = useState("");
  const [votingState, setVotingState] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [failedGoogleViewer, setFailedGoogleViewer] = useState(false);
  const [showTextSearch, setShowTextSearch] = useState(false);

  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const pdfUrl = `https://firebasestorage.googleapis.com/v0/b/chatjfkfiles.firebasestorage.app/o/2025JFK%2F${id}.pdf?alt=media`;
  const encodedPdfUrl = encodeURIComponent(pdfUrl);
  const shareUrl = `https://jfkfilesarchive.com/doc/${id}`;
  const shareMessage = `Check out this declassified JFK document: "${docTitle}"`;
  
  useEffect(() => {
    setIsLoading(true);
    setFailedGoogleViewer(false);
    const fallbackTimer = setTimeout(() => {
      setFailedGoogleViewer(true);
      setIsLoading(false);
    }, 5000); // Fallback after 5 seconds

    return () => clearTimeout(fallbackTimer);
  }, [id]);
  

  const loadDocMetadata = async () => {
    const docRef = doc(db, "2025JFK", id);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setDocTitle(data.title || id);
        setDocDescription(data.description || "Declassified document from the JFK archive.");
      }
  
      // ✅ Grab all votes from docVotes where docId === id
      const votesQuery = query(collection(db, "docVotes"), where("docId", "==", id));
      const voteSnapshots = await getDocs(votesQuery);
  
      let upvotes = 0;
      let downvotes = 0;
  
      voteSnapshots.forEach((doc) => {
        const vote = doc.data();
        if (vote.type === "up") upvotes++;
        if (vote.type === "down") downvotes++;
      });
  
      setVoteCount(upvotes - downvotes);
  
    } catch (err) {
      console.error("Error loading metadata or votes:", err);
    }
  };
  
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const voteRef = doc(db, "docVotes", `${currentUser.uid}_${id}`);
        const voteSnap = await getDoc(voteRef);
        if (voteSnap.exists()) {
          setVotingState(voteSnap.data().type); // 'up' or 'down'
        }
      }
      
    });
    return () => unsubscribe();
  }, [auth, db, id]);

  useEffect(() => {
    loadDocMetadata();
  }, [id]);
  
  
  
  useEffect(() => {
    const handleIframeLoad = () => setIsLoading(false);
    window.addEventListener('iframeLoaded', handleIframeLoad);
  
    return () => window.removeEventListener('iframeLoaded', handleIframeLoad);
  }, []);
  

  useEffect(() => {
    // Cache the results when the page changes
    sessionStorage.setItem(id, JSON.stringify({
      views,
      voteCount,
      votingState,
      isBookmarked
    }));
  }, [id, views, voteCount, votingState, isBookmarked]);

  const updateViews = async () => {
    const docRef = doc(db, "2025JFK", id);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const currentViews = snap.data().views || 0;
        const currentVotes = snap.data().voteDelta || 0;
        setViews(currentViews + 1);
        setVoteCount(currentVotes);
        await updateDoc(docRef, {
          views: increment(1)
        });
      } else {
        await setDoc(docRef, {
          views: 1,
          upvotes: 0,
          downvotes: 0,
          voteDelta: 0,
          createdAt: serverTimestamp()
        });
        setViews(1);
        setVoteCount(0);
      }
    } catch (err) {
      console.error("Failed to update views:", err);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      setVoteMessage("Please sign in to bookmark this document.");
      return;
    }
    try {
      const bookmarkRef = doc(db, "users", user.uid, "bookmarks", id);
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
        setVoteMessage("Bookmark removed");
      } else {
        await setDoc(bookmarkRef, {
          docId: id,
          addedAt: serverTimestamp()
        });
        setIsBookmarked(true);
        setVoteMessage("Document bookmarked!");
      }
    } catch (error) {
      console.error("Error bookmarking:", error);
      setVoteMessage("Bookmark action failed.");
    }
  };

  const handleVote = async (type) => {
    if (!user) {
      setVoteMessage("Sign in to vote.");
      return;
    }
    try {
      const currentVote = votingState;
      let newVoteCount = voteCount;

      if (currentVote === type) {
        setVotingState(null);
        newVoteCount = type === 'up' ? newVoteCount - 1 : newVoteCount + 1;
      } else if (currentVote) {
        setVotingState(type);
        newVoteCount = type === 'up' ? newVoteCount + 2 : newVoteCount - 2;
      } else {
        setVotingState(type);
        newVoteCount = type === 'up' ? newVoteCount + 1 : newVoteCount - 1;
      }

      setVoteCount(newVoteCount);

      const castVote = httpsCallable(functions, "castVotes");
      const res = await castVote({ docId: id, type });
      setVoteMessage(res.data.message);
    } catch (error) {
      console.error("Voting error:", error.message);
      setVoteMessage("Failed to vote. Try again.");

      const docRef = doc(db, "2025JFK", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setVoteCount(snap.data().voteDelta || 0);
      }
    }
  };

  

  return (
    <><Helmet>
    <title>{docTitle}</title>
    <meta name="description" content={docDescription} />
    <meta property="og:title" content={docTitle} />
    <meta property="og:description" content={docDescription} />
    <meta property="og:type" content="article" />
    <meta property="og:url" content={`https://jfkfilesarchive.com/doc/${id}`} />
  </Helmet>
  
    <div className="doc-page-container">
      <div className="doc-content">
        <div className="pdf-viewer">
      {isLoading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}

      {!failedGoogleViewer ? (
        <iframe
          src={`https://docs.google.com/gview?embedded=true&url=${encodedPdfUrl}`}
          style={{ width: '100%', height: '100%', border: 'none', display: isLoading ? 'none' : 'block' }}
          title="JFK PDF Viewer"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setFailedGoogleViewer(true);
            setIsLoading(false);
          }}
        />
      ) : (
        <embed
          src={pdfUrl}
          type="application/pdf"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      )}
    </div>
        <div className="doc-info">

          <button
            className="back-to-results button-primary"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Search
          </button>
          <h2>{docTitle}</h2>
          <p>{docDescription}</p>
          <h2>
            <small style={{ marginLeft: '10px' }}>
              (ID: {id})
              <a href={pdfUrl} download style={{ marginLeft: '8px', fontSize: '0.8rem' }}>
                [Download PDF]
              </a>
            </small>
          </h2>
          <button className="text-search-btn" onClick={() => setShowTextSearch(true)}>
            🔍 Search Document Text
          </button>

        <div className="share-buttons">
                  <p style={{ marginBottom: '6px' }}>Share this document:</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <FacebookShareButton url={shareUrl} quote={shareMessage}>
                      <FacebookIcon size={32} round />
                    </FacebookShareButton>
                    <TwitterShareButton url={shareUrl} title={shareMessage}>
                      <TwitterIcon size={32} round />
                    </TwitterShareButton>
                    <WhatsappShareButton url={shareUrl} title={shareMessage}>
                      <WhatsappIcon size={32} round />
                    </WhatsappShareButton>
                    <EmailShareButton url={shareUrl} subject="Declassified JFK Document" body={shareMessage}>
                      <EmailIcon size={32} round />
                    </EmailShareButton>
                  </div>
                </div>

          <div className="vote-buttons">
            <div className="vote-container">
              <button 
                className={`vote-button ${votingState === 'up' ? 'active-up' : ''}`}
                onClick={() => handleVote("up")}
              >
                <FontAwesomeIcon icon={faArrowUp} />
              </button>
              <span className="vote-count">{voteCount}</span>
              <button 
                className={`vote-button ${votingState === 'down' ? 'active-down' : ''}`}
                onClick={() => handleVote("down")}
              >
                <FontAwesomeIcon icon={faArrowDown} />
              </button>
            </div>

            <button 
              className={`bookmark-button ${isBookmarked ? 'active' : ''}`}
              onClick={handleBookmark}
            >
              <FontAwesomeIcon icon={faBookmark} />
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>

            <div className="view-count">
              <FontAwesomeIcon icon={faEye} />
              <span>{views.toLocaleString()} views</span>
            </div>
          </div>

        

          {voteMessage && <p className="vote-message">{voteMessage}</p>}

          <div className="comments-section">
            <Comments docId={id} />
          </div>
        </div>
      </div>
    </div>
    {showTextSearch && (
  <TextSearchModal docId={id} onClose={() => setShowTextSearch(false)} />
)}

    </>
  );
}

export default DocPage;
