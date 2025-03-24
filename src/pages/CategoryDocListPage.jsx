import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import './SearchResults.css'; // Reusing your search results CSS

function CategoryDocListPage() {
  const { groupName, categoryName } = useParams();
  const decodedGroup = decodeURIComponent(groupName.replace(/-/g, ' '));
  const decodedCategory = decodeURIComponent(categoryName.replace(/-/g, ' '));
  const navigate = useNavigate();

  const db = getFirestore();

  const [docIds, setDocIds] = useState([]);
  const [docData, setDocData] = useState({});
  const [loading, setLoading] = useState(true);
  const [thumbnailIndexes, setThumbnailIndexes] = useState({});

  useEffect(() => {
    async function fetchDocs() {
      try {
        setLoading(true);

        const groupSnap = await getDoc(doc(db, 'groupsIndex', decodedGroup));
        const categorySnap = await getDoc(doc(db, 'categoriesIndex', decodedCategory));

        if (!groupSnap.exists() || !categorySnap.exists()) {
          console.warn('Group or category not found.');
          setLoading(false);
          return;
        }

        const groupDocs = groupSnap.data().doc_ids || [];
        const categoryDocs = categorySnap.data().doc_ids || [];

        // Intersection
        const intersection = groupDocs.filter((id) => categoryDocs.includes(id));
        setDocIds(intersection);

        // Fetch data for each doc
        const dataMap = {};
        for (const id of intersection) {
          const ref = doc(db, '2025JFK', id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();

            // Fetch votes
            const votesSnap = await getDocs(
              query(collection(db, 'docVotes'), where('docId', '==', id))
            );
            let up = 0,
              down = 0;
            votesSnap.forEach((v) => {
              const type = v.data().type;
              if (type === 'up') up++;
              if (type === 'down') down++;
            });

            // Fetch comment count
            const commentsSnap = await getDocs(
              query(collection(db, 'comments'), where('docId', '==', id))
            );
            const commentCount = commentsSnap.size;

            dataMap[id] = {
              title: cleanText(data.title || 'Untitled', cancellationLines.title),
              description: cleanText(data.description || '', cancellationLines.description),
              thumbnails: data.thumbnails || [],
              views: data.views || 0,
              votes: { up, down },
              comments: commentCount,
            };
          }
        }

        setDocData(dataMap);
        setLoading(false);
      } catch (err) {
        console.error('Error loading category docs:', err);
        setLoading(false);
      }
    }

    fetchDocs();
  }, [decodedGroup, decodedCategory, db]);

  const handleDocClick = (id) => {
    navigate(`/doc/${id}`);
  };

  const handleThumbnailNav = (id, dir) => {
    const total = docData[id]?.thumbnails?.length || 0;
    setThumbnailIndexes((prev) => {
      const curr = prev[id] || 0;
      const next = (curr + dir + total) % total;
      return { ...prev, [id]: next };
    });
  };

  const cancellationLines = {
    title: [
      'Here is a clear and concise title for the document excerpt:',
      'Here is a clear and concise title under 15 words:',
    ],
    description: [
      'Here is a summary of the document excerpt in 2-3 concise and informative sentences:',
      'Here is a concise and informative summary:',
      'Here is a summary of the document excerpt in 2-3 concise sentences: ',
    ],
  };

  const cleanText = (text, lines) => {
    let cleaned = text.trim();
    lines.forEach((line) => {
      const regex = new RegExp('^' + line.trim().replace(/[.*+?^=!:${}()|[\]/\\]/g, '\\$&') + '.*', 'i');
      cleaned = cleaned.replace(regex, '').trim();
    });
    return cleaned.replace(/^"|"$/g, '');
  };

  return (
    <div className="search-container">
         <button
      className="back-button"
      onClick={() => navigate(`/archive/${groupName}`)}
    >
      ⬅ Back to {decodedGroup}
    </button>
      <h1>{decodedCategory}</h1>
      <h2>From group: {decodedGroup}</h2>

      {loading && <p>Loading documents...</p>}

      {!loading && docIds.length === 0 && <p>No documents found.</p>}

      {!loading && docIds.length > 0 && (
        <div className="results-list">
          {docIds.map((id) => {
            const doc = docData[id];
            if (!doc) return null;
            const currentIndex = thumbnailIndexes[id] || 0;
            const thumbs = Array.isArray(doc.thumbnails) ? doc.thumbnails : [];
            if (thumbs.length === 0) {
              console.warn(`🚫 No thumbnails found for doc: ${id}`, {
                doc,
                thumbnails: doc.thumbnails
              });
            }
            
            return (
              <div className="result-item" key={id}>
                <div className="result-left">
                  <div
                    className="doc-title clickable"
                    onClick={() => handleDocClick(id)}
                  >
                    {doc.title}
                  </div>
                  <div className="doc-description">
                     {doc.description}                   
                     </div>
                  <div className="doc-meta">
                    <span>📁 {decodedGroup}</span>
                    <p>
                      <strong>Views:</strong> {doc.views}
                    </p>
                    <p>
                      <strong>Votes:</strong> {doc.votes.up} up / {doc.votes.down} down
                    </p>
                    <p>
                      <strong>Comments:</strong> {doc.comments}
                    </p>
                  </div>
                </div>

                {thumbs.length > 0 && (
                  <div className="thumbnail-viewer">
          
                    <img
                      src={thumbs[currentIndex]}
                      alt={`Thumbnail for ${id}`}
                    />
                    <button
                      className="nav-button"
                      onClick={(e) => {
                        e.stopPropagation(); // ⛔ Prevents parent onClick
                        handleThumbnailNav(id, -1);
                      }}
                    >
                      ◀
                    </button>
                    <button
                      className="nav-button"
                      onClick={(e) => {
                        e.stopPropagation(); // ⛔ Prevents parent onClick
                        handleThumbnailNav(id, 1);
                      }}
                    >
                      ▶
                    </button>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoryDocListPage;
