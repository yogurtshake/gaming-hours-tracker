import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Game {
  _id: string;
  title: string;
}

interface Session {
  _id: string;
  game: Game;
  startTime: string;
  endTime: string;
  duration: number;
}

const SessionList: React.FC<{ userId: string }> = ({ userId }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [gameId, setGameId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    axios.get(`http://localhost:5000/api/sessions/${userId}`)
      .then(res => setSessions(res.data))
      .catch(err => console.error(err));
    axios.get(`http://localhost:5000/api/games`)
      .then(res => setGames(res.data))
      .catch(err => console.error(err));
  }, [userId]);

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/sessions', {
        user: userId,
        game: gameId,
        startTime,
        endTime
      });
      const res = await axios.get(`http://localhost:5000/api/sessions/${userId}`);
      setSessions(res.data);
      setGameId('');
      setStartTime('');
      setEndTime('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Sessions</h2>
      <form onSubmit={addSession}>
        <select value={gameId} onChange={e => setGameId(e.target.value)} required>
          <option value="">Select Game</option>
          {games.map(game => (
            <option key={game._id} value={game._id}>{game.title}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          required
        />
        <input
          type="datetime-local"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          required
        />
        <button type="submit">Add Session</button>
      </form>
      <ul>
        {sessions.map(session => (
          <li key={session._id}>
            {session.game?.title} | {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()} | {session.duration?.toFixed(0)} min
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SessionList;