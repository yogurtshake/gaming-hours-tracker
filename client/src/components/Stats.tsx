import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

ChartJS.register(ArcElement);

interface Session {
  _id: string;
  game: { _id: string; title: string };
  startTime: string;
  endTime: string;
  duration: number;
}

interface GameStat {
  _id: string;
  totalMinutes: number;
  sessions: number;
  game: { _id: string; title: string };
}

function formatTime(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
  if (hrs > 0) return `${hrs} hr`;
  return `${mins} min`;
}

type Range = 'day' | 'week' | 'month' | 'year';

const rangeLabels: Record<Range, string> = {
  day: 'Today',
  week: 'Past Week',
  month: 'Past Month',
  year: 'Past Year',
};

const Stats: React.FC<{ userId: string; range: Range; setRange: (r: Range) => void }> = ({ userId, range, setRange }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goalMsg, setGoalMsg] = useState('');
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [goalPerDay, setGoalPerDay] = useState<number>(1);
  const [goalInput, setGoalInput] = useState<number>(1);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/sessions/${userId}`).then(res => setSessions(res.data)).catch(() => setSessions([]));
  }, [userId]);

  useEffect(() => {
  axios
    .get(`http://localhost:5000/api/sessions/${userId}/game-stats?range=${range}`)
    .then(res => {
      setGameStats(res.data);
    })
    .catch(err => setGameStats([]));
  }, [userId, range]);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/users/${userId}/goal`)
      .then(res => {
        setGoalPerDay(res.data.goalPerDay);
        setGoalInput(res.data.goalPerDay);
      });
  }, [userId]);

  const handleGoalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.put(`http://localhost:5000/api/users/${userId}/goal`, { goalPerDay: goalInput });
    setGoalPerDay(goalInput);
  };

  const rangeMultipliers: Record<string, number> = {
    day: 1,
    week: 7,
    month: 30,
    year: 365,
  };
  
  const scaledGoal = goalPerDay * rangeMultipliers[range];

  const pieData = {
    labels: gameStats.map(stat => stat.game?.title || 'Unknown Game'),
    datasets: [
      {
        data: gameStats.map(stat => stat.totalMinutes),
        backgroundColor: [
          '#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236',
          '#166a8f', '#00a950', '#58595b', '#8549ba'
        ],
      },
    ],
  };

  const pieOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const data = context.chart.data.datasets[0].data;
            const total = data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} min (${percentage}%)`;
          }
        }
      },
      legend: {
        display: true,
        position: 'bottom' as const,
      }
    }
  };

  const filteredSessions = sessions.filter(session => {
    const now = new Date();
    const sessionDate = new Date(session.startTime);
    switch (range) {
      case 'day':
        return sessionDate.toDateString() === now.toDateString();
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return sessionDate >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return sessionDate >= monthAgo;
      }
      case 'year': {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return sessionDate >= yearAgo;
      }
      default:
        return true;
    }
  });

  const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const chartData = {
    labels: filteredSessions.map(s => new Date(s.startTime).toLocaleDateString()),
    datasets: [
      {
        label: 'Minutes Played',
        data: filteredSessions.map(s => s.duration),
        fill: false,
        borderColor: 'blue',
      },
    ],
  };

  return (
    <div>
      <h2>Stats</h2>
      
      <div style={{ textAlign: 'center' }}>
        <label>Show data for: </label> <br />
        {(['day', 'week', 'month', 'year'] as Range[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{ fontWeight: range === r ? 'bold' : 'normal' }}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>
      
      <h3>Total Time: {formatTime(totalMinutes)}</h3>
      
      <hr className="section-divider" />
      
      <div style={{ textAlign: 'center' }}>
        {goalInput > 0 && (
          <div>
            Goal: {scaledGoal} hours per {range}
            <br />
            {totalMinutes / 60 > scaledGoal ? (
              <span style={{ color: 'red' }}>Goal exceeded!</span>
            ) : (
              <span style={{ color: 'green' }}>Within goal</span>
            )}
          </div>
        )}

        <form onSubmit={handleGoalSave} style={{ margin: '1rem 0', display: 'inline-block' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Set goal (hours per day):
            <input
              id="goalInput"
              type="number"
              value={goalInput}
              onChange={e => setGoalInput(Number(e.target.value))}
              min={0}
              step={0.1}
              style={{ width: '40px' }}
            />
            <button type="submit">Save Goal</button>
          </div>
        </form>
      </div>
    
    <hr className="section-divider" />

    <div style={{ maxWidth: 600, margin: '2em 0' }}>
      <Line data={chartData} />
    </div>

    <div>
      <h3>Per-Game Stats ({rangeLabels[range]})</h3>
      <table>
          <thead>
          <tr>
              <th>Game</th>
              <th>Total Hours</th>
              <th>Sessions</th>
          </tr>
          </thead>
        
          <tbody>
          {gameStats.length === 0 ? (
            <tr>
              <td colSpan={3}>No data for this range.</td>
            </tr>
          ) : (
            gameStats.map(stat => (
              <tr key={stat._id}>
                <td>{stat.game?.title || 'Unknown Game'}</td>
                <td>{(stat.totalMinutes / 60).toFixed(2)}</td>
                <td>{stat.sessions}</td>
              </tr>
            ))
          )}
          </tbody>
      </table>
      {gameStats.length > 0 && (
        <div style={{ maxWidth: 400, margin: '2em auto' }}>
          <Pie data={pieData} options={pieOptions} />
        </div>
      )}

    </div>

  </div>
  );
};

export default Stats;