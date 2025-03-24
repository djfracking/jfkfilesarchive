import React, { useEffect, useState, useRef } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowUp, 
  faArrowDown, 
  faFire, 
  faEdit,
  faSave,
  faUserCircle,
  faSignInAlt
} from "@fortawesome/free-solid-svg-icons";
import AuthModal from "./AuthModal"; // Import the AuthModal component

const functions = getFunctions();
const auth = getAuth();

// Internal styles object with Apple dark mode theme
const styles = {
  container: {
    padding: '24px',
    paddingBottom: 0,
    backgroundColor: '#1c1c1e',
    color: '#ffffff',
    borderRadius: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  heading: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#ffffff',
  },
  commentSection: {
    // marginBottom: '30px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    borderBottom: '1px solid rgb(56, 56, 58)',
    // paddingBottom: '16px'
  
  },
  signInPrompt: {
    backgroundColor: '#2c2c2e',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '30px',
    width: "calc('100%' - '32px')",
    fontWeight: '600',
  },
  signInText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f1f1f1',
    textAlign: 'center',
  },
  signInButton: {
    padding: '8px 16px',
    backgroundColor: '#f1f1f1',
    color: '#333',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
  },
  avatarContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarIcon: {
    fontSize: '24px',
    color: '#8e8e93',
  },
  inputContainer: {
    flex: 1,
  },
  textarea: {
    width: '100%', // Changed from "calc('100%' - '8px')" to '100%'
    padding: '12px 16px',
    backgroundColor: '#2c2c2e',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    resize: 'none',
    fontSize: '14px',
    height: '60px',
    maxHeight: '120px',
    outline: 'none',
    fontFamily: 'inherit',
    overflowY: 'auto',
    boxSizing: 'border-box', // Added box-sizing to include padding in width calculation
  },
  commentActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  postButton: {
    padding: '8px 16px',
    backgroundColor: '#f1f1f1',
    color: '#333',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  disabledButton: {
    backgroundColor: '#3a3a3c',
    color: '#8e8e93',
    cursor: 'not-allowed',
  },
  commentsListContainer: {
    // marginTop: '24px',
    overflowY: 'auto',
    maxHeight: '400px', // Set a maximum height to enable scrolling
    flex: 1, // Allow the list to grow and take available space
    paddingRight: '8px', // Add some padding for the scrollbar
    borderTop: '1px'
  },
  commentItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid rgb(56, 56, 58)',
    position: 'relative',
  },
  voteColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingRight: '12px',
    minWidth: '40px',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '4px',
  },
  userName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#ffffff',
    marginRight: '8px',
  },
  commentDate: {
    fontSize: '12px',
    color: '#8e8e93',
  },
  commentText: {
    fontSize: '14px',
    lineHeight: 1.4,
    margin: '8px 0',
    color: '#ffffff',
  },
  commentMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '8px',
  },
  voteButton: {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    color: '#8e8e93',
    cursor: 'pointer',
    padding: '4px',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  voteButtonUpActive: {
    color: '#ff9500', // Apple orange color
  },
  voteButtonDownActive: {
    color: '#ff453a', // Apple red color
  },
  voteCount: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '4px 0',
  },
  voteScore: {
    color: '#ffffff',
  },
  voteScorePositive: {
    color: '#ff9500', // Apple orange color
  },
  voteScoreNegative: {
    color: '#ff453a', // Apple red color
  },
  icon: {
    fontSize: '14px',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    color: '#8e8e93',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
  },
  editContainer: {
    marginTop: '12px',
    width: '100%',
  },
  editActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  saveButton: {
    background: 'none',
    border: 'none',
    color: '#f1f1f1',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  cancelButton: {
    background: 'none',
    border: 'none',
    color: '#8e8e93',
    cursor: 'pointer',
    fontSize: '13px',
  },
  moreButton: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#8e8e93',
    cursor: 'pointer',
    padding: '4px',
  },
  loadingText: {
    color: '#8e8e93',
    fontSize: '14px',
    textAlign: 'center',
    padding: '16px 0',
  },
  noCommentsText: {
    color: '#8e8e93',
    fontSize: '14px',
    textAlign: 'center',
    padding: '16px 0',
  },
  scrollTrack: {
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      background: '#2c2c2e',
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb': {
      background: '#4c4c4e',
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: '#6c6c6e',
    },
  }
};

const Comments = ({ docId }) => {
  const [comments, setComments] = useState([]);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState(''); // 'vote' or 'comment'

  // Listen for auth state changes (handles refresh and timing issues)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Enhanced user object with avatar and username
        const enhancedUser = {
          ...user,
          photoURL: user.photoURL || null,
          displayName: user.displayName || "Anonymous"
        };
        setCurrentUser(enhancedUser);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchComments = async () => {
    // Only set loading if we don't already have comments
    if (comments.length === 0) {
      setLoading(true);
    }
    
    try {
      const getComments = httpsCallable(functions, "getComments");
      const res = await getComments({ docId });
      console.log("💬 Comments fetched:", res.data);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error("❌ Error fetching comments:", err);
    }
    
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;
    
    // Create a temporary comment ID outside the try block so it's available in catch
    const tempId = `temp-${Date.now()}`;
    
    try {
      // Don't set global loading state - we'll handle optimistic UI updates instead
      
      // Create a temporary comment object for optimistic UI update
      const tempComment = {
        id: tempId,
        text: newText,
        userId: currentUser?.uid,
        userName: currentUser?.displayName || "You",
        username: currentUser?.displayName || "You",
        avatar: currentUser?.photoURL || null,
        createdAt: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
        upvotes: 0,
        downvotes: 0,
        voteDelta: 0,
        userVotes: {},
        isTemp: true // Flag to identify temporary comments
      };
      
      // Add temporary comment to the UI
      setComments(prev => [tempComment, ...prev]);
      
      // Clear the input
      setNewText("");
      
      // Call the API without affecting the UI state
      const addComment = httpsCallable(functions, "addComment");
      const result = await addComment({ docId, text: newText });
      
      // If successful, replace temp comment with real one
      if (result.data && result.data.id) {
        setComments(prev => prev.map(comment => 
          comment.isTemp && comment.id === tempId ? { ...result.data, isTemp: false } : comment
        ));
      } else {
        // If something went wrong with the response but we didn't get an error,
        // just leave the temporary comment in place
        console.warn("Received unexpected response format from addComment:", result);
      }
    } catch (err) {
      console.error("❌ Error adding comment:", err);
      // Remove only the specific temp comment on error
      setComments(prev => prev.filter(comment => !(comment.isTemp && comment.id === tempId)));
      // Don't reload all comments - just show a console error
    }
    // No finally block with loading state changes
  };

  const handleEdit = async (commentId, text) => {
    try {
      // Find the comment being edited
      const commentToEdit = comments.find(c => c.id === commentId);
      if (!commentToEdit) return;
      
      // Store the original text in case we need to revert
      const originalText = commentToEdit.text;
      
      // Optimistically update the UI
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, text, editedAt: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 } } 
          : c
      ));
      
      // Exit edit mode
      setEditingId(null);
      
      // Make the API call in background
      const editComment = httpsCallable(functions, "editComment");
      await editComment({ commentId, text });
      
      // No need to refresh comments here since we've already updated the UI
    } catch (err) {
      console.error("❌ Error editing comment:", err);
      // On error, refresh comments to ensure data consistency
      fetchComments();
    }
  };
  
  const handleVote = async (commentId, type) => {
    // Prevent voting if not logged in
    if (!currentUser) {
      // Show auth modal with vote context
      setAuthAction('vote');
      setShowAuthModal(true);
      return;
    }
    
    try {
      // Find the comment being voted on
      const targetComment = comments.find(c => c.id === commentId);
      if (!targetComment) return;
      
      // Get the current user's previous vote if any
      const currentUserVote = targetComment.userVotes?.[currentUser?.uid];
      
      // Create a deep copy of comments to modify (to avoid any state update issues)
      const updatedComments = comments.map(comment => {
        if (comment.id !== commentId) return comment;
      
        const updatedComment = {
          ...comment,
          userVotes: { ...(comment.userVotes || {}) }
        };
      
        const previousVote = updatedComment.userVotes[currentUser?.uid];
      
        if (previousVote === type) {
          // 🔁 Same vote clicked → remove it
          delete updatedComment.userVotes[currentUser?.uid];
          if (type === 'up') {
            updatedComment.upvotes = Math.max(0, (updatedComment.upvotes || 0) - 1);
            updatedComment.voteDelta = (updatedComment.voteDelta || 0) - 1;
          } else {
            updatedComment.downvotes = Math.max(0, (updatedComment.downvotes || 0) - 1);
            updatedComment.voteDelta = (updatedComment.voteDelta || 0) + 1;
          }
        } else if (previousVote) {
          // 🔁 Switching vote (up ↔ down)
          updatedComment.userVotes[currentUser?.uid] = type;
      
          if (previousVote === 'up') {
            updatedComment.upvotes = Math.max(0, (updatedComment.upvotes || 0) - 1);
            updatedComment.downvotes = (updatedComment.downvotes || 0) + 1;
            updatedComment.voteDelta = (updatedComment.voteDelta || 0) - 2;
          } else {
            updatedComment.downvotes = Math.max(0, (updatedComment.downvotes || 0) - 1);
            updatedComment.upvotes = (updatedComment.upvotes || 0) + 1;
            updatedComment.voteDelta = (updatedComment.voteDelta || 0) + 2;
          }
        } else {
          // ✅ New vote
          updatedComment.userVotes[currentUser?.uid] = type;
          if (type === 'up') {
            updatedComment.upvotes = (updatedComment.upvotes || 0) + 1;
            updatedComment.voteDelta = (updatedComment.voteDelta || 0) + 1;
          } else {
            updatedComment.downvotes = (updatedComment.downvotes || 0) + 1;
            updatedComment.voteDelta = (updatedComment.voteDelta || 0) - 1;
          }
        }
      
        return updatedComment;
      });
      
      
      
      // Update state in a single operation to prevent flashing
      setComments(updatedComments);
      
      // Make the API call in the background without waiting
      const voteComment = httpsCallable(functions, "voteComment");
      voteComment({ commentId, type }).catch(err => {
        console.error("❌ Error voting on comment:", err);
        // On error, refresh comments to ensure data consistency
        fetchComments();
      });
      
    } catch (err) {
      console.error("❌ Error in vote handling logic:", err);
      // On error, refresh comments to ensure data consistency
      fetchComments();
    }
  };

  const handleShowSignIn = (action) => {
    setAuthAction(action);
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    // This would typically trigger your sign-in flow
    // For this example, we'll just close the modal
    // In a real app, you'd redirect to your auth provider or show a sign-in form
    console.log("Sign In button clicked");
    setShowAuthModal(false);
    
    // In a real implementation, you would call your authentication function here
    // Example: authService.signIn();
  };

  const handleSignUp = () => {
    // This would typically trigger your sign-up flow
    console.log("Sign Up button clicked");
    setShowAuthModal(false);
    
    // In a real implementation, you would call your authentication function here
    // Example: authService.signUp();
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  useEffect(() => {
    if (docId) {
      fetchComments();
    }
  }, [docId]);

  // Format date with single letter abbreviations
  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    
    // Convert Firestore timestamp to JavaScript Date
    let commentDate;
    if (timestamp._seconds) {
      // Handle Firestore timestamp format
      commentDate = new Date(timestamp._seconds * 1000);
    } else if (timestamp instanceof Date) {
      commentDate = timestamp;
    } else {
      // Handle regular timestamp
      commentDate = new Date(timestamp);
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - commentDate) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
    
    // For times older than a year
    return `${Math.floor(diffInSeconds / 31536000)}y`;
  };

  // Create a combined style for the commentsListContainer with the scroll styling
  const commentsListStyle = {
    ...styles.commentsListContainer,
    ...styles.scrollTrack
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Comments</h2>

      {/* Auth Modal Component */}
      <AuthModal 
        showModal={showAuthModal}
        setShowModal={setShowAuthModal}
        authAction={authAction}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />

      {/* Add Comment Section - Only show if user is signed in */}
      {currentUser ? (
        <div style={styles.commentSection}>
          <div style={styles.avatarContainer}>
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName} 
                style={{width: '100%', height: '100%', objectFit: 'cover'}} 
              />
            ) : (
              <FontAwesomeIcon icon={faUserCircle} style={styles.avatarIcon} />
            )}
          </div>
          <div style={styles.inputContainer}>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Add a comment..."
              style={styles.textarea}
            />
            {newText.trim() && (
              <div style={styles.commentActions}>
                <button
                  onClick={handleAdd}
                  style={styles.postButton}
                >
                  Comment
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.signInPrompt}>
          <p style={styles.signInText}>Sign in to join the conversation</p>
          <button 
            style={styles.signInButton}
            onClick={() => handleShowSignIn('comment')}
          >
            <FontAwesomeIcon icon={faSignInAlt} />
            Sign In to Comment
          </button>
        </div>
      )}

      {/* Display Comments with scroll */}
      <div style={commentsListStyle}>
        {comments.length === 0 && !loading ? (
          <p style={styles.noCommentsText}>No comments yet. Be the first to comment!</p>
        ) : (
          [...comments]
          .sort((a, b) => (b.voteDelta || 0) - (a.voteDelta || 0))
          .map((comment) => {
            const isOwnComment = currentUser?.uid === comment.userId;
            const isEditing = editingId === comment.id;
            
            // Check if user has voted on this comment
            const hasUpvoted = comment.userVotes && comment.userVotes[currentUser?.uid] === 'up';
            const hasDownvoted = comment.userVotes && comment.userVotes[currentUser?.uid] === 'down';

            return (
              <div key={comment.id} style={styles.commentItem}>
                <div style={styles.voteColumn}>
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleVote(comment.id, "up")}
                    style={{
                      ...styles.voteButton,
                      ...(hasUpvoted ? styles.voteButtonUpActive : {})
                    }}
                  >
                    <FontAwesomeIcon icon={faArrowUp} />
                  </button>
                  
                  {/* Vote Score */}
                  <div style={{
                    ...styles.voteCount,
                    ...(comment.voteDelta > 0 ? styles.voteScorePositive : {}),
                    ...(comment.voteDelta < 0 ? styles.voteScoreNegative : {}),
                    ...(comment.voteDelta === 0 ? styles.voteScore : {})
                  }}>
                    {comment.voteDelta || 0}
                  </div>
                  
                  {/* Downvote Button */}
                  <button
                    onClick={() => handleVote(comment.id, "down")}
                    style={{
                      ...styles.voteButton,
                      ...(hasDownvoted ? styles.voteButtonDownActive : {})
                    }}
                  >
                    <FontAwesomeIcon icon={faArrowDown} />
                  </button>
                </div>
                
                <div style={styles.avatarContainer}>
                  {comment.avatar ? (
                    <img 
                      src={comment.avatar} 
                      alt={comment.username || comment.userName || "User"} 
                      style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUserCircle} style={styles.avatarIcon} />
                  )}
                </div>
                <div style={styles.commentContent}>
                  <div style={styles.commentHeader}>
                    <span style={styles.userName}>{comment.username || comment.userName || "Anonymous"}</span>
                    <span style={styles.commentDate}>{formatDate(comment.createdAt || comment.timestamp)}</span>
                  </div>
                  
                  {/* Comment Text or Edit Field */}
                  {isEditing ? (
                    <div style={styles.editContainer}>
                      <textarea
                        value={comment.text}
                        onChange={(e) => {
                          setComments((prev) =>
                            prev.map((c) =>
                              c.id === comment.id
                                ? { ...c, text: e.target.value }
                                : c
                            )
                          );
                        }}
                        style={styles.textarea}
                      />
                      <div style={styles.editActions}>
                        <button onClick={cancelEdit} style={styles.cancelButton}>
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleEdit(comment.id, comment.text)} 
                          style={styles.saveButton}
                        >
                          <FontAwesomeIcon icon={faSave} style={styles.icon} />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p style={styles.commentText}>{comment.text}</p>
                        {comment.editedAt && (
                          <span style={{
                            fontSize: '12px',
                            color: '#8e8e93',
                            fontStyle: 'italic',
                            marginTop: '4px',
                            display: 'inline-block'
                          }}>
                            (edited)
                          </span>
                        )}
                      </div>
                      
                      <div style={styles.commentMeta}>
                        {/* Fire score - only show if significantly positive */}
                        {comment.voteDelta > 5 && (
                          <span style={{
                            ...styles.voteButton,
                            cursor: 'default'
                          }}>
                            <FontAwesomeIcon icon={faFire} style={{
                              ...styles.icon,
                              color: '#ff9500' // Apple orange color
                            }} />
                            <span style={{marginLeft: '6px'}}>Trending</span>
                          </span>
                        )}
                        
                        {/* Edit Button (only for own comments) */}
                        {isOwnComment && (
                          <button
                            onClick={() => setEditingId(comment.id)}
                            style={styles.actionButton}
                          >
                            <FontAwesomeIcon icon={faEdit} style={styles.icon} />
                            Edit
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
        {loading && comments.length === 0 && (
          <p style={styles.loadingText}>Loading comments...</p>
        )}
      </div>
    </div>
  );
};

export default Comments;