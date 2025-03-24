import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import googleLogo from '../assets/googleLogo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserSecret } from '@fortawesome/free-solid-svg-icons';
import './auth.css';

const ERROR_MESSAGES = {
  'auth/invalid-email': 'Please enter a valid email.',
  'auth/email-already-in-use': 'That email is already registered.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/popup-closed-by-user': 'Google sign‑in was cancelled.',
};


function SignUp() {
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generateAnonymousUsername = () => {
    const animals = ['Falcon', 'Wolf', 'Otter', 'Panther', 'Cobra', 'Fox'];
    const adjectives = ['Quiet', 'Hidden', 'Mysterious', 'Sneaky', 'Shy', 'Invisible'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animals[Math.floor(Math.random() * animals.length)]}${Math.floor(Math.random() * 1000)}`;
  };

  const uploadAvatarToStorage = async (uid, file) => {
    const storageRef = ref(storage, `userAvatars/${uid}.jpg`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const createUserDocIfNotExists = async (user, avatarURL = null, name = null) => {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        username: name || generateAnonymousUsername(),
        email: user.email || null,
        isAnonymous: user.isAnonymous,
        createdAt: new Date().toISOString(),
        photoURL: avatarURL || user.photoURL || null,
      });
    } else {
      const data = snap.data();
      // If username is missing, update it
      if (!data.username && name) {
        await setDoc(
          userRef,
          {
            username: name,
          },
          { merge: true }
        );
      }
    }
  };
  

  const handleEmailSignUp = async () => {
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      let avatarURL = null;
      if (avatarFile) {
        avatarURL = await uploadAvatarToStorage(userCred.user.uid, avatarFile);
      }
      await createUserDocIfNotExists(userCred.user, avatarURL, username);
      navigate('/');
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Something went wrong — please try again.');
        }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    if (!username.trim()) {
      setError("Username is required for Google sign-in.");
      return;
    }
  
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      await createUserDocIfNotExists(user, user.photoURL, username); // ensure username is passed
      navigate('/');
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Something went wrong — please try again.');
        }
    setLoading(false);
  };
  

  const handleAnonymousSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;
      const randomName = generateAnonymousUsername();

      sessionStorage.setItem('anonUser', JSON.stringify({
        uid: user.uid,
        isAnonymous: true,
        createdAt: new Date().toISOString(),
        username: randomName,
      }));

      await createUserDocIfNotExists(user, null, randomName);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
         <Helmet>
        <title>Sign Up — JFK Files Archive</title>
        <meta name="description" content="Create an account to explore the JFK Files Archive." />
        <link rel="canonical" href="https://jfkfilesarchive.com/signup" />
      </Helmet>

      <div className="auth-container">
        <h2>Sign Up to the Archives</h2>

        {/* Show username input always, hide it during anonymous sign-in */}
        <input
          type="text"
          placeholder="Username (required unless anonymous)"
          value={username}
          className="auth-input"
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          className="auth-input"
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          className="auth-input"
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <label className="auth-file-label">
          Upload Avatar:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files[0])}
            className="auth-input-file"
            disabled={loading}
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button
          onClick={handleEmailSignUp}
          className="auth-button"
          disabled={loading}
        >
          Create Account
        </button>

        <div className="auth-divider">OR</div>

        <button
          type="button"
          className="signInGoogle-button"
          onClick={handleGoogleSignUp}
          disabled={loading}
        >
          <img src={googleLogo} alt="Google Logo" className="google-logo" />
          Continue with Google
        </button>

        <button
          type="button"
          className="anonymous-button"
          onClick={handleAnonymousSignUp}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faUserSecret} className="anon-icon" />
          Enter as Anonymous
        </button>

        <p className="auth-switch">
          Already have an account?{' '}
          <a href="/signin" className="auth-link">Log In</a>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
