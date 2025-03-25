import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserSecret } from '@fortawesome/free-solid-svg-icons';
import googleLogo from '../assets/googleLogo.png';
import './auth.css';

const ERROR_MESSAGES = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/popup-closed-by-user': 'Google sign‑in was cancelled.',
};

function SignIn() {
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createUserDocIfNotExists = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: user.email || null,
        isAnonymous: user.isAnonymous,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const saveSessionUser = async (user) => {
    const token = await user.getIdToken();
    sessionStorage.setItem(
      'authUser',
      JSON.stringify({
        uid: user.uid,
        email: user.email || null,
        photoURL: user.photoURL || null,
        isAnonymous: user.isAnonymous,
        token,
      })
    );
  };

  const handleLogin = async (loginFn) => {
    setLoading(true);
    setError('');
    try {
      const result = await loginFn();
      const user = result.user;
      await createUserDocIfNotExists(user);
      await saveSessionUser(user);
      navigate('/');
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Helmet>
        <title>Sign In — JFK Files Archive</title>
        <meta name="description" content="Sign in to search the complete JFK Files Archive." />
        <link rel="canonical" href="https://jfkfilesarchive.com/signin" />
      </Helmet>

      <div className="auth-container">
        <h2>Welcome back</h2>

        <input
          type="email"
          placeholder="Email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error && <p className="auth-error">{error}</p>}

        <button
          onClick={() => handleLogin(() => signInWithEmailAndPassword(auth, email, password))}
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Logging in…' : 'Log In with Email'}
        </button>

        <div className="auth-divider">OR</div>

        <button
          className="signInGoogle-button"
          onClick={() => handleLogin(() => signInWithPopup(auth, provider))}
          disabled={loading}
        >
          {loading ? '' : <>
            <img src={googleLogo} alt="Google Logo" className="google-logo" />
            Continue with Google
          </>}
        </button>

        <button
          className="anonymous-button"
          onClick={() => handleLogin(() => signInAnonymously(auth))}
          disabled={loading}
        >
          {loading ? <span className="spinner"></span> : <>
            <FontAwesomeIcon icon={faUserSecret} className="anon-icon" />
            Continue Anonymously
          </>}
        </button>

        <p className="auth-switch">
          Don't have an account?{' '}
          <a href="/signup" className="auth-link">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignIn;
