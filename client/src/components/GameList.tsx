import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Game {
  _id: string;
  title: string;
  iconUrl?: string;
}

const GameList: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [title, setTitle] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editIconUrl, setEditIconUrl] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/games')
      .then(res => setGames(res.data))
      .catch(err => console.error(err));
  }, []);

  const addGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/games', { title, iconUrl });
      setGames([...games, res.data]);
      setTitle('');
      setIconUrl('');
      setMessage('');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to add game');
    }
  };

  const startEdit = (game: Game) => {
    setEditingId(game._id);
    setEditTitle(game.title);
    setEditIconUrl(game.iconUrl || '');
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditIconUrl('');
    setMessage('');
  };

  const saveEdit = async (gameId: string) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/games/${gameId}`, {
        title: editTitle,
        iconUrl: editIconUrl,
      });
      setGames(games.map(g => g._id === gameId ? res.data : g));
      cancelEdit();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to update game');
    }
  };

  return (
    <div>
      <h2>Games</h2>
      <form onSubmit={addGame}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Game Title" required />
        <input value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="Icon URL" />
        <button type="submit">Add Game</button>
      </form>
      {message && <div style={{ color: 'red' }}>{message}</div>}
      <ul>
        {games.map(game => (
          <li key={game._id}>
            {editingId === game._id ? (
              <>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Game Title"
                  required
                />
                <input
                  value={editIconUrl}
                  onChange={e => setEditIconUrl(e.target.value)}
                  placeholder="Icon URL"
                />
                <button onClick={() => saveEdit(game._id)} type="button">Save</button>
                <button onClick={cancelEdit} type="button">Cancel</button>
              </>
            ) : (
              <>
                {game.iconUrl && <img src={game.iconUrl} alt={game.title} width={32} style={{ verticalAlign: 'middle' }} />}
                {game.title}
                <button onClick={() => startEdit(game)} type="button">Edit</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameList;