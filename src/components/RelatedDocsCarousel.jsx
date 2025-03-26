import React, { useEffect, useState, useRef } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './RelatedDocsCarousel.css'; // Add custom CSS styles for the carousel

function RelatedDocsCarousel({ docId }) {
  const db = getFirestore();
  const navigate = useNavigate();
  const carouselRef = useRef(null); // Reference to the carousel container
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardWidth, setCardWidth] = useState(0); // Track the card width dynamically

  useEffect(() => {
    async function fetchRelatedDocs() {
      try {
        // Step 1: Fetch the current document to get group and category info
        const docRef = doc(db, "2025JFK", docId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setLoading(false);
          return;
        }

        const docData = docSnap.data();
        const docCategory = docData.category;  // Category is the doc ID in categoriesIndex
        const docGroup = docData.group;  // Group is the doc ID in groupsIndex

        // Log the category and group to debug
        console.log("Category:", docCategory);
        console.log("Group:", docGroup);

        // Step 2: Initialize a set to collect related document IDs
        let relatedDocIds = new Set();

        // Step 3: Fetch related documents from categoriesIndex by category name
        if (docCategory) {
          const categoryRef = doc(db, "categoriesIndex", docCategory); // Use category as doc ID
          const categorySnap = await getDoc(categoryRef);

          if (categorySnap.exists()) {
            const categoryDocIds = categorySnap.data().doc_ids || [];
            categoryDocIds.forEach(id => relatedDocIds.add(id));
            console.log(`Fetched related doc IDs from category ${docCategory}:`, categoryDocIds);
          } else {
            console.log(`No category document found for: ${docCategory}`);
          }
        }

        // Step 4: Fetch related documents from groupsIndex by group name
        if (docGroup) {
          const groupRef = doc(db, "groupsIndex", docGroup); // Use group as doc ID
          const groupSnap = await getDoc(groupRef);

          if (groupSnap.exists()) {
            const groupDocIds = groupSnap.data().doc_ids || [];
            groupDocIds.forEach(id => relatedDocIds.add(id));
            console.log(`Fetched related doc IDs from group ${docGroup}:`, groupDocIds);
          } else {
            console.log(`No group document found for: ${docGroup}`);
          }
        }

        // Log the collected relatedDocIds
        console.log("Collected Related Document IDs:", Array.from(relatedDocIds));

        // Step 5: Check if we have any related docIds before querying
        if (relatedDocIds.size === 0) {
          console.error("No related document IDs found.");
          setLoading(false);
          return;
        }

        // Step 6: Fetch the related documents by their Firestore document IDs
        const docsPromises = Array.from(relatedDocIds).map((docId) => getDoc(doc(db, "2025JFK", docId)));

        // Fetch all related documents concurrently
        const relatedDocsSnapshot = await Promise.all(docsPromises);

        // Log the query result for debugging
        console.log("Related Docs Snapshot:", relatedDocsSnapshot);

        // Step 7: Check if any documents were returned
        if (relatedDocsSnapshot.length === 0) {
          console.log("No related documents found in the snapshot.");
        }

        const docs = relatedDocsSnapshot.map(doc => {
          const title = doc.data().title || "No Title";
          const thumbnailUrl = doc.data().thumbnails ? doc.data().thumbnails[0] : 'default_thumbnail_url'; // Fallback if no thumbnail is present
          console.log(`Fetched Doc: ${title}, Thumbnail: ${thumbnailUrl}`);
          return {
            id: doc.id,
            title,
            thumbnailUrl,
          };
        });

        // Log the final docs array
        console.log("Final Docs Array:", docs);

        // Step 8: Shuffle the related documents to randomize the order
        const shuffledDocs = shuffleArray(docs);
        setRelatedDocs(shuffledDocs);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching related documents:", err);
        setLoading(false);
      }
    }

    fetchRelatedDocs();
  }, [docId, db]);

  // Function to shuffle the documents
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function to navigate to the selected document page
  const handleDocClick = (docId) => {
    navigate(`/doc/${docId}`);
    window.scrollTo(0, 0); // Force scroll to top on navigation
  };

  // Function to scroll carousel left by one card
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -cardWidth, // Scroll one card width to the left
        behavior: 'smooth',
      });
    }
  };

  // Function to scroll carousel right by one card
  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: cardWidth, // Scroll one card width to the right
        behavior: 'smooth',
      });
    }
  };

  // Calculate the width of the card after the component is mounted
  useEffect(() => {
    if (carouselRef.current) {
      const card = carouselRef.current.querySelector('.carousel-item');
      if (card) {
        setCardWidth(card.offsetWidth);
      }
    }
  }, [relatedDocs]);

  if (loading) {
    return <div>Loading related documents...</div>;
  }

  return (
    <div className="related-docs-carousel">
      <h3>Related Documents</h3>
      <div className="carousel-controls">
        {/* Left and right buttons */}
        <button className="scroll-button left" onClick={scrollLeft}>❮</button>
        <div className="carousel-container" ref={carouselRef}>
          {relatedDocs.map(doc => (
            <div
              key={doc.id}
              className="carousel-item"
              onClick={() => handleDocClick(doc.id)} // Add onClick to navigate to the document
            >
              <img src={doc.thumbnailUrl} alt={doc.title} className="carousel-thumbnail" />
              <h4 className="carousel-title">{doc.title}</h4>
            </div>
          ))}
        </div>
        <button className="scroll-button right" onClick={scrollRight}>❯</button>
      </div>
    </div>
  );
}

export default RelatedDocsCarousel;
