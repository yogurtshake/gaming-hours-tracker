import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import Register from './components/Register';
import Login from './components/Login';
import GameList from './components/GameList';
import SessionList from './components/SessionList';
import UserSettings from './components/UserSettings';
import Stats from './components/Stats';

function App() {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));
  const [games, setGames] = useState([]);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [statsRange, setStatsRange] = useState<"day" | "week" | "month" | "year">("week");

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

  const fetchGames = async () => {
    try {
      const res = await axios.get('/games');
      setGames(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  return (
    <div className="main-layout">
 
      {userId && (
        <aside className="games-sidebar">
          <GameList userId={userId} games={games} refreshGames={fetchGames} />
        </aside>
      )}
      
      <div className="main-content">
        <div className="app-container">
          <Router basename="/gaming-hours-tracker">
            <nav>
              {userId ? (
                <>
                  <Link to="/">Sessions</Link> | <Link to="/settings">Settings</Link> |{" "}
                  <button onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/register">Register</Link> | <Link to="/login">Login</Link>
                </>
              )}
            </nav>

            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              
              <Route
                path="/"
                element={
                  userId ? (
                    <>
                      {userId && username && <div>Logged in as: {username}</div>}
                      <hr className="section-divider" />
                      <SessionList userId={userId} games={games} onSessionsChanged={() => setStatsRefreshKey(k => k + 1)} />
                      <hr className="section-divider" />                  
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
        </div>
      </div>

      {userId && (
        <aside className="stats-sidebar">
          <Stats 
            userId={userId} 
            key={statsRefreshKey} 
            range={statsRange}
            setRange={setStatsRange}
          />
        </aside>
      )}
      
    </div>
  );
}

export default App;