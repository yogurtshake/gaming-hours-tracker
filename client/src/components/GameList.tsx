import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Game {
  _id: string;
  title: string;
  iconUrl?: string;
}

interface GameListProps {
  userId: string;
  games: Game[];
  refreshGames: () => void;
}

const GameList: React.FC<GameListProps> = ({ userId, games, refreshGames }) => {
  const [title, setTitle] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editIconUrl, setEditIconUrl] = useState('');
  const [showFavourites, setShowFavourites] = useState(true);
  const [favourites, setFavourites] = useState<Game[]>([]);

  const addGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/games', { title, iconUrl });
      setTitle('');
      setIconUrl('');
      setMessage('');
      refreshGames();
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
      await axios.put(`http://localhost:5000/api/games/${gameId}`, {
        title: editTitle,
        iconUrl: editIconUrl,
      });
      cancelEdit();
      refreshGames();
      if (userId) {
        const res = await axios.get(`http://localhost:5000/api/users/${userId}/favourites`);
        setFavourites(res.data);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to update game');
    }
  };

  useEffect(() => {
    if (userId) {
      axios.get(`http://localhost:5000/api/users/${userId}/favourites`).then(res => setFavourites(res.data));
    }
  }, [userId]);

  const isFavourite = (gameId: string) => favourites.some(g => g._id === gameId);

  const toggleFavourite = async (gameId: string) => {
    const action = isFavourite(gameId) ? 'remove' : 'add';
    try {
      const res = await axios.post(`http://localhost:5000/api/users/${userId}/favourites`, { gameId, action });
      setFavourites(res.data);
    } catch (err) {
      setMessage('Failed to update favourites');
    }
  };

  const displayedGames = showFavourites ? favourites : games;

  return (
    <div>
      <h2>Games</h2>
      <form onSubmit={addGame}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Game Title" required />
        <input value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="Icon URL" />
        <button type="submit">Add Game</button>
      </form>
      {message && <div style={{ color: 'red' }}>{message}</div>}

      <hr className="section-divider" />

      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button
          onClick={() => setShowFavourites(true)}
          disabled={showFavourites}
          style={{
            fontWeight: showFavourites ? 'bold' : 'normal',
            marginRight: '0.5rem'
          }}
        >
          Favourites
        </button>
        <button
          onClick={() => setShowFavourites(false)}
          disabled={!showFavourites}
          style={{
            fontWeight: !showFavourites ? 'bold' : 'normal'
          }}
        >
          All Games
        </button>
      </div>

      <h3>{showFavourites ? 'Favourite Games' : 'All Games'}</h3>

      <ul className="game-list">
        {displayedGames.length === 0 && (
          <li style={{ textAlign: 'center', color: '#888' }}>
            {showFavourites ? 'No favourite games yet.' : 'No games found.'}
          </li>
        )}
        {displayedGames.map(game => (
          <li key={game._id} className="game-list-item">
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
                <button
                  onClick={() => toggleFavourite(game._id)}
                  type="button"
                  title={isFavourite(game._id) ? "Remove from favourites" : "Add to favourites"}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.3rem',
                    color: isFavourite(game._id) ? '#ff9800' : '#bbb',
                    marginRight: '0.5rem',
                  }}
                >
                  {isFavourite(game._id) ? '★' : '☆'}
                </button>
                {game.iconUrl && <img src={game.iconUrl} alt={game.title} width={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />}
                {game.title}
                <button onClick={() => startEdit(game)} type="button" style={{ marginLeft: 'auto' }}>Edit</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameList;