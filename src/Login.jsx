import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:4000/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || '登入失敗');
    }
  };

  return (
    <div className="login-container">
      <h2>會員登入</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required/>
        </div>
        <div>
          <label>密碼</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required/>
        </div>
        <button type="submit">登入</button>
      </form>
    </div>
  );
}
