import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import './Archives.css';

function GroupArchivePage() {
  const { groupName } = useParams();
  const db = getFirestore();
  const navigate = useNavigate();

  const decodedGroupName = decodeURIComponent(groupName.replace(/-/g, ' '));

  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const groupRef = doc(db, "groupsIndex", decodedGroupName);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
          console.warn(`Group '${decodedGroupName}' not found.`);
          setLoading(false);
          return;
        }

        const groupDocIds = groupSnap.data().doc_ids || [];

        const categoriesRef = collection(db, "categoriesIndex");
        const categoriesSnapshot = await getDocs(categoriesRef);

        const subs = categoriesSnapshot.docs.map(doc => {
          const intersection = (doc.data().doc_ids || []).filter(id => groupDocIds.includes(id));
          return {
            categoryName: doc.id,
            docCount: intersection.length
          };
        }).filter(cat => cat.docCount > 0);

        subs.sort((a, b) => b.docCount - a.docCount);
        setSubcategories(subs);
        setLoading(false);
      } catch (err) {
        console.error("Error loading group categories:", err);
        setLoading(false);
      }
    }

    fetchData();
  }, [decodedGroupName, db]);

  const handleCategoryClick = (categoryName) => {
    const urlSafeCategory = encodeURIComponent(categoryName.replace(/\s+/g, '-'));
    navigate(`/archive/${groupName}/${urlSafeCategory}`);
  };

  if (loading) return <div className="archives-loading">Loading group...</div>;

  return (
    <div className="archives-container">
      <button
        className="back-button"
        onClick={() => navigate('/archive')}
      >
        ⬅ Back to All Groups
      </button>

      <h1>{decodedGroupName}</h1>
      <h2>Categories in this group:</h2>
      <div className="archives-board">
        {subcategories.map(sub => (
          <div
            key={sub.categoryName}
            className="group-card clickable"
            onClick={() => handleCategoryClick(sub.categoryName)}
          >
            <h3>{sub.categoryName}</h3>
            <p>{sub.docCount} document{sub.docCount !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupArchivePage;
