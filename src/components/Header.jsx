import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import seal from "../assets/seal.png";
import "../Website.css";
import { FaGithub, FaUser, FaBookmark, FaBars, FaTimes } from "react-icons/fa";

const Header = () => {
  const [authUser, setAuthUser] = useState(null);
  const [avatarURL, setAvatarURL] = useState(null);
  const [username, setUsername] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const { uid, email, isAnonymous } = user;
        setAuthUser({ uid, email, isAnonymous });

        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setAvatarURL(data.photoURL || null);
            setUsername(data.username || "Anonymous");
          } else {
            setAvatarURL(null);
            setUsername("Anonymous");
          }
        } catch (err) {
          console.error("❌ Error loading user doc:", err);
          setUsername("Unknown");
        }
      } else {
        setAuthUser(null);
        setAvatarURL(null);
        setUsername(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut(getAuth());
    setDropdownOpen(false);
  };

  const getTitle = () => {
    const host = window.location.hostname;
    if (host.includes("chatjfkfiles.com")) return "JFK Assassination Files Archive";
    if (host.includes("jfkfilesarchives.com")) return "JFK Assassination Files Archive";
    return "JFK Assassination Files Archive";
  };

  return (
    <header className="header">
      <div className="nav-container">
        <div className="nav-left">
          <img src={seal} alt="Presidential Seal" className="site-seal" />
          <Link to="/" className="site-title">{getTitle()}</Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-right desktop-nav">
          <Link to="/" className="nav-link">Search</Link>
          <Link to="/archive" className="nav-link">Archive</Link>
          <Link to="/codewords" className="nav-link">Codewords</Link>
          <Link to="/methods" className="nav-link">Methods</Link>
          <a
            href="https://github.com/djfracking/jfkfilesarchive"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link github-icon"
          >
            <FaGithub size={26} />
          </a>
          {authUser ? (
            <div className="nav-avatar-wrapper" ref={dropdownRef}>
              {avatarURL ? (
                <img
                  src={avatarURL}
                  alt="User Avatar"
                  className="avatar-img"
                  title={authUser.email || "User"}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                />
              ) : (
                <div
                  className="avatar-icon-wrapper"
                  title={authUser.email || "User"}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <FaUser size={26} />
                </div>
              )}
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <p className="dropdown-item"><strong>{username}</strong></p>
                  <p className="dropdown-item" style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                    {authUser.email || "No email"}
                  </p>
                  <hr className="dropdown-separator" />
                  <Link to="/bookmarks" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <FaBookmark style={{ marginRight: "6px" }} /> Bookmarks
                  </Link>
                  <p className="dropdown-item" onClick={handleSignOut}>
                    Sign out
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/signin" className="nav-link button-topbar" style={{ fontSize: "0.9rem" }}>
                Sign In
              </Link>
              <Link to="/signup" className="nav-link button-topbar" style={{ fontSize: "0.9rem" }}>
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation - Only shown on mobile */}
        <div className="mobile-nav">
          <button 
            className="hamburger-btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FaTimes size={26} /> : <FaBars size={26} />}
          </button>
          {mobileMenuOpen && (
            <nav className="nav-right mobile-menu">
              <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Search</Link>
              <Link to="/methods" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Methods</Link>
              <Link to="/codewords" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Codewords</Link>
              <Link to="/archive" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Archive</Link>
              <a
                href="https://github.com/djfracking/jfkfilesarchive"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link github-icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaGithub size={26} />
              </a>
              {authUser ? (
                <div className="nav-avatar-wrapper" ref={dropdownRef}>
                  {avatarURL ? (
                    <img
                      src={avatarURL}
                      alt="User Avatar"
                      className="avatar-img"
                      title={authUser.email || "User"}
                      onClick={() => {
                        setDropdownOpen(!dropdownOpen);
                        setMobileMenuOpen(false);
                      }}
                    />
                  ) : (
                    <div
                      className="avatar-icon-wrapper"
                      title={authUser.email || "User"}
                      onClick={() => {
                        setDropdownOpen(!dropdownOpen);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <FaUser size={26} />
                    </div>
                  )}
                  {dropdownOpen && (
                    <div className="dropdown-menu">
                      <p className="dropdown-item"><strong>{username}</strong></p>
                      <p className="dropdown-item" style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                        {authUser.email || "No email"}
                      </p>
                      <hr className="dropdown-separator" />
                      <Link to="/bookmarks" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
                        <FaBookmark style={{ marginRight: "6px" }} /> Bookmarks
                      </Link>
                      <p className="dropdown-item" onClick={handleSignOut}>
                        Sign out
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/signin" className="nav-link button-primary" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/signup" className="nav-link button-primary" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
