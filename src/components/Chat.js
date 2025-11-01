import React, { useState, useEffect, useCallback } from "react";
import ContactList from "./ContactList";

function Chat({ userPhone, onLogout, socket }) {
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("");
  const [chatData, setChatData] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);

  const fetchChats = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/chats/${userPhone}`);
      const chats = await response.json();
      setChatData(chats);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  }, [userPhone]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (selectedChat) {
      setReceiver(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    socket.on('receiveMessage', (msgData) => {
      setChatData(prev => {
        const updated = { ...prev };
        const other = msgData.sender === userPhone ? msgData.receiver : msgData.sender;
        if (!updated[other]) updated[other] = [];
        updated[other].push(msgData);
        return updated;
      });
    });

    socket.on('messageSent', (msgData) => {
      setChatData(prev => {
        const updated = { ...prev };
        const other = msgData.receiver;
        if (!updated[other]) updated[other] = [];
        updated[other].push(msgData);
        return updated;
      });
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('messageSent');
    };
  }, [socket, userPhone]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!receiver || !message.trim()) return;

    const msgData = {
      sender: userPhone,
      text: message,
      time: new Date().toLocaleTimeString()
    };

    // Optimistically update chatData for immediate UI feedback
    setChatData(prev => {
      const updated = { ...prev };
      if (!updated[receiver]) updated[receiver] = [];
      updated[receiver].push(msgData);
      return updated;
    });

    socket.emit('sendMessage', { sender: userPhone, receiver, text: message });
    setMessage("");
    setSelectedChat(receiver);
    // Keep receiver set for continued chatting and open the chat
  };

  const handleSelectChat = (number) => {
    setSelectedChat(number);
  };

  const messages = selectedChat ? chatData[selectedChat] || [] : [];

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h3>Your Contacts</h3>
        <ContactList chats={chatData} onSelect={handleSelectChat} />
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="chat-box">
        <h2>Welcome, {userPhone}</h2>

        {selectedChat ? (
          <>
            <h3>Chat with {selectedChat}</h3>
            <div className="messages">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message ${
                    msg.sender === userPhone ? "sent" : "received"
                  }`}
                >
                  <p>{msg.text}</p>
                  <small>{msg.time}</small>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>Select a contact or start a new chat</p>
        )}

        <form onSubmit={handleSend} className="chat-form">
          <input
            type="tel"
            placeholder="Receiver's phone number"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
          />
          <textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
