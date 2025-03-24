import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom"; // Import for navigation

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#2c2c2e',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 23px 0 rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#ffffff',
    textAlign: 'center',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '20px',
  },
  modalButton: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  modalPrimaryButton: {
    backgroundColor: '#f1f1f1',
    color: '#333',
  },
  modalSecondaryButton: {
    backgroundColor: '#3a3a3c',
    color: '#ffffff',
  },
  signInText: {
    fontSize: '14px',
    color: '#f1f1f1',
    textAlign: 'center',
  },
};

const AuthModal = ({ 
  showModal, 
  setShowModal, 
  authAction, 
  onSignIn, 
  onSignUp,
  signInPath = "/signin",  // Default path for sign-in
  signUpPath = "/signup"   // Default path for sign-up
}) => {
  const navigate = useNavigate(); // Hook for navigation

  if (!showModal) return null;

  // Handle sign in button click
  const handleSignIn = () => {
    setShowModal(false); // Close the modal
    
    // If onSignIn callback exists, call it
    if (onSignIn && typeof onSignIn === 'function') {
      onSignIn();
    }
    
    // Navigate to sign-in page
    navigate(signInPath);
  };

  // Handle sign up button click
  const handleSignUp = () => {
    setShowModal(false); // Close the modal
    
    // If onSignUp callback exists, call it
    if (onSignUp && typeof onSignUp === 'function') {
      onSignUp();
    }
    
    // Navigate to sign-up page
    navigate(signUpPath);
  };

  return (
    <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3 style={styles.modalHeader}>
          {authAction === 'vote' 
            ? 'Sign in to vote on comments' 
            : 'Sign in to join the conversation'}
        </h3>
        <p style={{...styles.signInText, marginBottom: '16px'}}>
          {authAction === 'vote'
            ? 'You need to be signed in to vote on comments.'
            : 'Sign in to add your thoughts and join the discussion.'}
        </p>
        <div style={styles.modalButtons}>
          <button 
            style={{...styles.modalButton, ...styles.modalSecondaryButton}}
            onClick={handleSignUp}
          >
            Sign Up
          </button>
          <button 
            style={{...styles.modalButton, ...styles.modalPrimaryButton}}
            onClick={handleSignIn}
          >
            <FontAwesomeIcon icon={faSignInAlt} style={{marginRight: '8px'}} />
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;