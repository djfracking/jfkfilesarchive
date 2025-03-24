import React, { useState } from "react";
import "../Website.css";

const Chat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const handleSend = (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    // Add user's message
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate a bot response after a short delay
    setTimeout(() => {
      const botMessage = { text: `Bot: You said "${input}"`, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);

    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="chat-form">
        <input
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="chat-send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
