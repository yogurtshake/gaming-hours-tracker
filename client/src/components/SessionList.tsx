import React, { useEffect, useState } from "react";
import axios from "axios";
import { usePagination } from "../hooks/pagination";
import PaginationControls from "./PaginationControls";

interface Game {
  _id: string;
  title: string;
  iconUrl?: string;
}

interface Session {
  _id: string;
  startTime: string;
  endTime: string;
  game: Game;
  duration: number;
}

interface SessionListProps {
  userId: string;
  games: Game[];
  onSessionsChanged?: () => void;
}

export function formatDuration(minutes: number): string {
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
  const sortedSessions = [...sessions].sort(
  (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  const {
    paginatedItems: paginatedSessions,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
  } = usePagination(sortedSessions);

  useEffect(() => {
    const savedGameId = localStorage.getItem('newSessionGameId');
    const savedStartTime = localStorage.getItem('newSessionStartTime');
    if (savedGameId) setGameId(savedGameId);
    if (savedStartTime) setStartTime(savedStartTime);
  }, []);

  useEffect(() => {
    axios
      .get(`/sessions/${userId}`)
      .then((res) => setSessions(res.data))
      .catch((err) => console.error(err));
  }, [userId]);

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startTime) >= new Date(endTime)) {
      alert("Start time must be before end time.");
      return;
    }
    try {
      await axios.post("/sessions", {
        user: userId,
        game: gameId,
        startTime,
        endTime,
      });
      const res = await axios.get(`/sessions/${userId}`);
      setSessions(res.data);
      setGameId("");
      setStartTime("");
      setEndTime("");
      localStorage.removeItem('newSessionGameId');
      localStorage.removeItem('newSessionStartTime');
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
    if (new Date(editStartTime) >= new Date(editEndTime)) {
      alert("Start time must be before end time.");
      return;
    }
    try {
      await axios.put(`/sessions/${sessionId}`, {
        game: editGameId,
        startTime: editStartTime,
        endTime: editEndTime,
      });
      const res = await axios.get(`/sessions/${userId}`);
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
      await axios.delete(`/sessions/${sessionId}`);
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
      <h2>SESSIONS</h2>

      <form onSubmit={addSession}>
        <select
          value={gameId}
          onChange={(e) => {
            setGameId(e.target.value);
            localStorage.setItem('newSessionGameId', e.target.value);
          }}
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
            onChange={(e) => {
              setStartTime(e.target.value);
              localStorage.setItem('newSessionStartTime', e.target.value);
            }}
            required
          />
          <button type="button" onClick={() => {
            const now = getNowForInput();
            setStartTime(now);
            localStorage.setItem('newSessionStartTime', now);
          }}>
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

        <span style={{ fontSize: '0.8em', fontStyle: 'italic', color: '#666' }}>
          *Game selection and start time will persist even if you leave the page*
        </span>

        <button type="submit">Add Session</button>
      </form>

      <hr className="section-divider" />

      <h3>Session List</h3>
      
      <PaginationControls
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      <table className="session-table">
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Game</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        
        <tbody>
          {paginatedSessions.map((session) => (
            <tr key={session._id} >
              {editingId === session._id ? (
                <>
                  <td colSpan={2}>
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
                  </td>

                  <td>
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
                  </td>

                  <td>
                    <button type="button" onClick={() => saveEdit(session._id)}>
                      Save
                    </button>
                    <button type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>
                    {(() => {
                      const start = new Date(session.startTime);
                      const end = new Date(session.endTime);
                      const sameDay = start.toLocaleDateString("en-CA") === end.toLocaleDateString("en-CA");
                      if (sameDay) {
                        return (
                          <>
                            {start.toLocaleDateString("en-CA")} <br />
                            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                            {" - "}
                            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                          </>
                        );
                      } else {
                        return (
                          <>
                            {start.toLocaleDateString("en-CA")}{" "}
                            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}{" "}
                            -<br />
                            {end.toLocaleDateString("en-CA")}{" "}
                            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                          </>
                        );
                      }
                    })()}
                  </td>

                  <td>
                    {session.game?.iconUrl && (
                      <img
                        src={session.game.iconUrl}
                        alt={session.game.title}
                        style={{
                          width: 20,
                          height: 20,
                          objectFit: "cover",
                          marginRight: 6,
                          borderRadius: 4,
                          display: "inline-block",
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                    {session.game?.title}
                  </td>

                  <td>{formatDuration(Math.round(session.duration))}</td>
                  <td>
                    <button type="button" className="small-btn" onClick={() => startEdit(session)}>
                      Edit
                    </button>
                    <button type="button" className="small-btn" onClick={() => deleteSession(session._id)}>
                      Delete
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SessionList;