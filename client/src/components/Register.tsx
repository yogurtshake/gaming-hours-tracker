import React, { useState } from 'react';
import axios from 'axios';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/users/register', {
        username, password
      });
      setMessage('Registration successful! You can now log in.');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h2>Register</h2>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
      <button type="submit">Register</button>
      <div>{message}</div>
    </form>
  );
};

export default Register;