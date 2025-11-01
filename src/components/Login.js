import React, { useState } from "react";

function Login({ onLogin, onRegister }) {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phone.trim() === "" || name.trim() === "" || password.trim() === "") {
      alert("Please fill in all fields!");
      return;
    }
    if (isRegister) {
      onRegister({ phone, name, password });
    } else {
      onLogin({ phone, name, password });
    }
  };

  return (
    <div className="login-container">
      <h2>{isRegister ? "Register" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="tel"
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{isRegister ? "Register" : "Login"}</button>
      </form>
      <button type="button" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
      </button>
    </div>
  );
}

export default Login;
