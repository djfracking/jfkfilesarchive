import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
} from "firebase/firestore";
import { getApp } from "firebase/app";
import "../Website.css";

const CodeWordsAdmin = () => {
  const db = getFirestore(getApp());

  const [codeWords, setCodeWords] = useState({});
  const [inputWord, setInputWord] = useState("");
  const [inputMeaning, setInputMeaning] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCodeWords = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "code_words"));
    const data = {};

    for (const wordDoc of snapshot.docs) {
      const word = wordDoc.id;
      const meaningsSnap = await getDocs(
        collection(db, "code_words", word, "meanings")
      );
      data[word] = meaningsSnap.docs.map((d) => d.data().meaning);
    }

    setCodeWords(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCodeWords();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const word = inputWord.trim().toLowerCase();
    const meaning = inputMeaning.trim();

    if (!word || !meaning) return;

    const wordRef = doc(db, "code_words", word);
    await setDoc(wordRef, {}, { merge: true }); // Ensure doc exists

    await addDoc(collection(wordRef, "meanings"), {
      meaning
    });

    setInputWord("");
    setInputMeaning("");
    await fetchCodeWords(); // refresh list
  };

  return (
    <div className="codewords-admin-container">
      <h2>Code Word Index</h2>
      <p>Due to the large amout of CIA codewords and ciphers, our search algorithm uses a user submitted index of codewords and meanings to find documents.</p>

      <form className="codewords-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Code word (e.g. cia)"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
        />
        <input
          type="text"
          placeholder="Meaning (e.g. central intelligence agency)"
          value={inputMeaning}
          onChange={(e) => setInputMeaning(e.target.value)}
        />
        <button type="submit">Add Code Word</button>
      </form>

      {loading ? (
        <p>Loading index...</p>
      ) : (
        <div className="codewords-list">
          {Object.entries(codeWords).map(([word, meanings]) => (
            <div key={word} className="codeword-entry">
              <h3>{word}</h3>
              <ul>
                {meanings.map((meaning, idx) => (
                  <li key={idx}>{meaning}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeWordsAdmin;
