import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserSettings: React.FC<{ userId: string; username: string | null; onUsernameChange: (username: string) => void }> = ({ userId, username, onUsernameChange }) => {
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [usernameMsg, setUsernameMsg] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    axios.get(`http://localhost:5000/api/users/${userId}`)
      .then(res => setCurrentEmail(res.data.email || null))
      .catch(() => setCurrentEmail(null));
  }, [userId]);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/users/email', { userId, email });
      setEmailMsg('Email updated!');
      setCurrentEmail(email);
      setEmail('');
    } catch (err: any) {
      setEmailMsg(err.response?.data?.error || 'Update failed');
    }
  };

  const handleRemoveEmail = async () => {
    try {
        await axios.put('http://localhost:5000/api/users/email', { userId, email: '' });
        setCurrentEmail(null);
        setEmailMsg('Email removed!');
    } catch (err: any) {
        setEmailMsg(err.response?.data?.error || 'Failed to remove email');
    }
  };

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.put('http://localhost:5000/api/users/username', { userId, newUsername });
      setUsernameMsg('Username updated!');
      onUsernameChange(res.data.username);
      setNewUsername('');
    } catch (err: any) {
      setUsernameMsg(err.response?.data?.error || 'Update failed');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/users/password', { userId, oldPassword, newPassword });
      setPasswordMsg('Password updated!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg(err.response?.data?.error || 'Update failed');
    }
  };

  return (
    <div>
      <h2>User Settings</h2>

      <form onSubmit={handleEmailUpdate}>
        <h3>Update Email Address</h3>
        <div>Current email: <b>{currentEmail ? currentEmail : 'none'}</b></div>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="New email address"
          required
        />
        <button type="submit">Update Email</button>
        <button type="button" onClick={handleRemoveEmail} disabled={!currentEmail}>
            Remove Email Address
        </button>
        <div>{emailMsg}</div>
      </form>  

      <hr />
      <form onSubmit={handleUsernameUpdate}>
        <h3>Update Username</h3>
        <div>Current username: <b>{username}</b></div>
        <input
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
          placeholder="New username"
          required
        />
        <button type="submit">Update Username</button>
        <div>{usernameMsg}</div>
      </form>
      <hr />

      <form onSubmit={handlePasswordUpdate}>
        <h3>Update Password</h3>
        <input
          type="password"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          placeholder="Old password"
          required
        />
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="New password"
          required
        />
        <button type="submit">Update Password</button>
        <div>{passwordMsg}</div>
      </form>

    </div>
  );
};

export default UserSettings;