import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Login from "./components/Login";
import Chat from "./components/Chat";

const socket = io("http://localhost:5000");

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("userPhone");
    const storedName = localStorage.getItem("userName");
    if (storedUser) {
      setUserPhone(storedUser);
      setUserName(storedName || "");
      setLoggedIn(true);
      socket.emit('join', storedUser);
    }
  }, []);

  const handleLogin = async ({ phone, name, password }) => {
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (data.success) {
        setUserPhone(phone);
        setUserName(name);
        localStorage.setItem("userPhone", phone);
        localStorage.setItem("userName", name);
        setLoggedIn(true);
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit('join', phone);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUserPhone("");
    setUserName("");
    socket.disconnect();
  };

  return (
    <div className="app-container">
      {loggedIn ? (
        <Chat userPhone={userPhone} userName={userName} onLogout={handleLogout} socket={socket} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
