import React, { useEffect, useState, useRef } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Archives.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import iconMapping from "./IconMapping"; // Your icon mapping file
import { Helmet } from 'react-helmet';

function Archives() {
  const db = getFirestore();
  const navigate = useNavigate();
  const [derivedGroups, setDerivedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const groupRefs = useRef({});
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar((prev) => !prev);

  const CACHE_KEY = "archivesDerivedData";
  const CACHE_TIMESTAMP_KEY = "archivesDerivedDataTimestamp";
  const CACHE_VALIDITY = 10 * 60 * 1000;

  useEffect(() => {
    async function fetchIndexes() {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        const now = Date.now();

        if (cachedData && cachedTime && (now - cachedTime < CACHE_VALIDITY)) {
          const parsed = JSON.parse(cachedData);
          setDerivedGroups(parsed);
          setLoading(false);
          return;
        }

        const groupsRef = collection(db, "groupsIndex");
        const groupsSnapshot = await getDocs(groupsRef);
        const groupsData = groupsSnapshot.docs.map(doc => ({
          groupName: doc.id,
          docIds: doc.data().doc_ids || []
        }));

        const categoriesRef = collection(db, "categoriesIndex");
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          categoryName: doc.id,
          docIds: doc.data().doc_ids || []
        }));

        const derived = groupsData.map(group => {
          const subcategories = categoriesData.map(category => {
            const intersection = category.docIds.filter(id => group.docIds.includes(id));
            return { name: category.categoryName, docCount: intersection.length };
          }).filter(sub => sub.docCount > 0);

          subcategories.sort((a, b) => b.docCount - a.docCount);

          return {
            groupName: group.groupName,
            urlSafeGroupName: encodeURIComponent(group.groupName.replace(/\s+/g, "-")),
            totalDocs: group.docIds.length,
            subcategories,
            subfoldersCount: subcategories.length
          };
        });

        derived.sort((a, b) => a.groupName.localeCompare(b.groupName));

        setDerivedGroups(derived);
        setLoading(false);
        localStorage.setItem(CACHE_KEY, JSON.stringify(derived));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
      } catch (err) {
        console.error("Error fetching indexes: ", err);
        setLoading(false);
      }
    }

    fetchIndexes();
  }, [db]);

  const handleCardClick = (urlSafeGroupName) => {
    navigate(`/archive/${urlSafeGroupName}`);
  };

  const scrollToGroup = (groupName) => {
    const ref = groupRefs.current[groupName];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredGroups = derivedGroups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="archives-loading">Loading Archives...</div>;
  }

  return (
    <div className="archives-wrapper">
           <Helmet>
              <title>Archives — 2025 JFK Assassination Files Archive</title>
              <meta name="description" content="Explore the complete 2025 JFK Assassination Files Archive — browse by thematic groups, subcategories, and access thousands of declassified documents." />
              <link rel="canonical" href="https://jfkfilesarchive.com/archives" />
              <meta property="og:type" content="website" />
              <meta property="og:title" content="Archives — 2025 JFK Assassination Files Archive" />
              <meta property="og:description" content="Explore the complete 2025 JFK Assassination Files Archive — browse by thematic groups, subcategories, and access thousands of declassified documents." />
              <meta property="og:url" content="https://jfkfilesarchive.com/archives" />
              <meta property="og:image" content="https://firebasestorage.googleapis.com/v0/b/chatjfkfiles.firebasestorage.app/o/seal.png?alt=media&token=6f179bcc-dcc8-4097-8aa9-028fa435008c" />
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content="Archives — 2025 JFK Assassination Files Archive" />
              <meta name="twitter:description" content="Explore the complete 2025 JFK Assassination Files Archive — browse by thematic groups, subcategories, and access thousands of declassified documents." />
              <meta name="twitter:image" content="https://firebasestorage.googleapis.com/v0/b/chatjfkfiles.firebasestorage.app/o/seal.png?alt=media&token=6f179bcc-dcc8-4097-8aa9-028fa435008c" />
            </Helmet>
      {/* Sidebar */}
      <div className={`archives-sidebar ${showSidebar ? 'visible' : ''}`}>
        <h3>Jump to Group</h3>
        <input
          type="text"
          className="archives-search"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ul className="archives-sidebar-list">
          {filteredGroups.map((group) => (
            <li
              key={group.groupName}
              className="sidebar-link"
              onClick={() => {
                scrollToGroup(group.groupName);
                setShowSidebar(false); // auto-close on click
              }}
            >
              {group.groupName}
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile-only search bar */}
      <div className="mobile-search-bar">
        <input
          type="text"
          className="archives-search"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Main content */}
      <div className="archives-container">
        <h1>2025 JFK Assassination Files Archive</h1>
        <div className="archives-board">
          {filteredGroups.map((group) => {
            const icon = iconMapping[group.groupName] || iconMapping["Historical Records"];
            return (
              <div
                key={group.groupName}
                className="group-card clickable"
                onClick={() => handleCardClick(group.urlSafeGroupName)}
                ref={(el) => (groupRefs.current[group.groupName] = el)}
              >
                <h2>
                  <FontAwesomeIcon icon={icon} /> {group.groupName}
                </h2>
                <p><strong>Subfolders:</strong> {group.subfoldersCount}</p>
                <p><strong>Total Documents:</strong> {group.totalDocs}</p>
                {group.subcategories.length > 0 && (
                  <div className="subcat-container">
                    <h3>Subcategories:</h3>
                    <ul>
                      {group.subcategories.map((sub) => (
                        <li key={sub.name}>
                          {sub.name} <span className="subcat-count">({sub.docCount})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Archives;
