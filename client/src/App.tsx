import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import GameList from './components/GameList';
import SessionList from './components/SessionList';
import UserSettings from './components/UserSettings';

function App() {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));

  const handleLogin = (id: string, username: string) => {
    setUserId(id);
    setUsername(username);
    localStorage.setItem('userId', id);
    localStorage.setItem('username', username);
  };

  const handleLogout = () => {
    setUserId(null);
    setUsername(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
  };

  return (
    <Router>
      <nav>
        <Link to="/">Home</Link> | <Link to="/settings">Settings</Link> | <Link to="/register">Register</Link> | <Link to="/login">Login</Link>
        {userId && <button onClick={handleLogout}>Logout</button>}
      </nav>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/"
          element={
            userId ? (
              <>
                {userId && username && <div><br />Welcome, {username}!</div>}
                <GameList />
                <SessionList userId={userId} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            userId ? (
              <UserSettings userId={userId} username={username} onUsernameChange={setUsername} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;