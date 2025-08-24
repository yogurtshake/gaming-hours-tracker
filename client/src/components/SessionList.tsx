import React, { useEffect, useState } from "react";
import axios from "axios";
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

interface SessionListProps {
  userId: string;
  games: Game[];
  onSessionsChanged?: () => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

function toLocalInputValue(isoString: string) {
  const date = new Date(isoString);
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISO = new Date(date.getTime() - tzOffset)
    .toISOString()
    .slice(0, 16);
  return localISO;
}

const SessionList: React.FC<SessionListProps> = ({ userId, games, onSessionsChanged }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [gameId, setGameId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGameId, setEditGameId] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/sessions/${userId}`)
      .then((res) => setSessions(res.data))
      .catch((err) => console.error(err));
  }, [userId]);

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/sessions", {
        user: userId,
        game: gameId,
        startTime,
        endTime,
      });
      const res = await axios.get(
        `http://localhost:5000/api/sessions/${userId}`
      );
      setSessions(res.data);
      setGameId("");
      setStartTime("");
      setEndTime("");
      if (onSessionsChanged) onSessionsChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (session: Session) => {
    setEditingId(session._id);
    setEditGameId(session.game._id);
    setEditStartTime(toLocalInputValue(session.startTime));
    setEditEndTime(toLocalInputValue(session.endTime));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditGameId("");
    setEditStartTime("");
    setEditEndTime("");
  };

  const saveEdit = async (sessionId: string) => {
    try {
      await axios.put(`http://localhost:5000/api/sessions/${sessionId}`, {
        game: editGameId,
        startTime: editStartTime,
        endTime: editEndTime,
      });
      const res = await axios.get(
        `http://localhost:5000/api/sessions/${userId}`
      );
      setSessions(res.data);
      cancelEdit();
      if (onSessionsChanged) onSessionsChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSession = async (sessionId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this session?"
    );
    if (!confirmed) return;
    try {
      await axios.delete(`http://localhost:5000/api/sessions/${sessionId}`);
      setSessions(sessions.filter((s) => s._id !== sessionId));
      if (onSessionsChanged) onSessionsChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const getNowForInput = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  return (
    <div>
      <h2>Sessions</h2>

      <form onSubmit={addSession}>
        <select
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          required
        >
          <option value="">Select game</option>
          {games.map((game) => (
            <option key={game._id} value={game._id}>
              {game.title}
            </option>
          ))}
        </select>
        
        <div className="datetime-row">
          START TIME:
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
          <button type="button" onClick={() => setStartTime(getNowForInput())}>
            Now
          </button>
        </div>
        
        <div className="datetime-row">
          END TIME:
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
          <button type="button" onClick={() => setEndTime(getNowForInput())}>
            Now
          </button>
        </div>

        <button type="submit">Add Session</button>
      </form>

      <ul className="session-list">
        {sessions.map((session) => (
          <li key={session._id} className="session-list-item">
            {editingId === session._id ? (
              <>
                <select
                  value={editGameId}
                  onChange={(e) => setEditGameId(e.target.value)}
                  required
                >
                  <option value="">Select game</option>
                  {games.map((game) => (
                    <option key={game._id} value={game._id}>
                      {game.title}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setEditStartTime(getNowForInput())}
                >
                  Now
                </button>
                <input
                  type="datetime-local"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setEditEndTime(getNowForInput())}
                >
                  Now
                </button>
                <button type="button" onClick={() => saveEdit(session._id)}>
                  Save
                </button>
                <button type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                {session.game?.title} |{" "}
                {new Date(session.startTime).toLocaleDateString()}{" "}
                {new Date(session.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}{" "}
                - {new Date(session.endTime).toLocaleDateString()}{" "}
                {new Date(session.endTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}{" "}
                | {formatDuration(Math.round(session.duration))}
                
                <div className="session-actions">
                  <button type="button" onClick={() => startEdit(session)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(session._id)}
                  >
                    Delete
                  </button>
                </div>
                
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SessionList;
