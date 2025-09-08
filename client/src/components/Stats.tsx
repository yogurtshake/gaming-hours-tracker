import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { usePagination } from '../hooks/pagination';
import PaginationControls from './PaginationControls';
import { formatDuration } from './SessionList';
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
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [goalPerDay, setGoalPerDay] = useState<number>(1);
  const [goalInput, setGoalInput] = useState<number>(1);
  const {
    paginatedItems: paginatedStats,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
  } = usePagination(gameStats, 5);


  useEffect(() => {
    axios.get(`/sessions/${userId}`).then(res => setSessions(res.data)).catch(() => setSessions([]));
  }, [userId]);

  useEffect(() => {
  axios
    .get(`/sessions/${userId}/game-stats?range=${range}`)
    .then(res => {
      setGameStats(res.data);
    })
    .catch(err => setGameStats([]));
  }, [userId, range]);

  useEffect(() => {
    axios.get(`/users/${userId}/goal`)
      .then(res => {
        setGoalPerDay(res.data.goalPerDay);
        setGoalInput(res.data.goalPerDay);
      });
  }, [userId]);

  const handleGoalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.put(`/users/${userId}/goal`, { goalPerDay: goalInput });
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
            return `${label}: ${formatDuration(value)} (${percentage}%)`;
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

  
  function getWeekLabel(date: Date) {
    const temp = new Date(date.getTime());
    temp.setHours(0, 0, 0, 0);
    temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
    const week1 = new Date(temp.getFullYear(), 0, 4);
    const weekNo = 1 + Math.round(
      ((temp.getTime() - week1.getTime()) / 86400000
        - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
    return `${temp.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  }

  function getMonthLabel(date: Date) {
    return date.toISOString().slice(0, 7);
  }

  let chartLabels: string[] = [];
  let chartData: number[] = [];

  if (range === 'month') {
    const sessionsByWeek: { [week: string]: number } = {};
    filteredSessions.forEach(session => {
      const week = getWeekLabel(new Date(session.startTime));
      sessionsByWeek[week] = (sessionsByWeek[week] || 0) + session.duration / 60;
    });
    const sortedWeeks = Object.keys(sessionsByWeek).sort();
    chartLabels = sortedWeeks;
    chartData = sortedWeeks.map(week => sessionsByWeek[week]);
  } else if (range === 'year') {
    const sessionsByMonth: { [month: string]: number } = {};
    filteredSessions.forEach(session => {
      const month = getMonthLabel(new Date(session.startTime));
      sessionsByMonth[month] = (sessionsByMonth[month] || 0) + session.duration / 60;
    });
    const sortedMonths = Object.keys(sessionsByMonth).sort();
    chartLabels = sortedMonths;
    chartData = sortedMonths.map(month => sessionsByMonth[month]);
  } else {
    const sessionsByDay: { [date: string]: number } = {};
    filteredSessions.forEach(session => {
      const date = new Date(session.startTime).toISOString().slice(0, 10);
      sessionsByDay[date] = (sessionsByDay[date] || 0) + session.duration / 60;
    });
    const sortedDates = Object.keys(sessionsByDay).sort();
    chartLabels = sortedDates;
    chartData = sortedDates.map(date => sessionsByDay[date]);
  }


  return (
    <div>
      <h2>STATS</h2>

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

    {range !== 'day' && (
      <div style={{ maxWidth: 600, margin: '2em 0' }}>
        <h3>Hours Played ({rangeLabels[range]})</h3>
        <Line
          data={{
            labels: chartLabels,
            datasets: [
              {
                label: 'Hours Played',
                data: chartData,
                borderColor: 'blue',
                backgroundColor: 'rgba(0,0,255,0.1)',
                tension: 0.3,
              },
            ],
          }}
        />
      </div>
    )}

    <div>
      <h3>Per-Game Stats ({rangeLabels[range]})</h3>
      
      <PaginationControls
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      <table>
          <thead>
          <tr>
              <th>Game</th>
              <th>Total Time</th>
              <th>Sessions</th>
          </tr>
          </thead>
        
          <tbody>
            {paginatedStats.length === 0 ? (
              <tr>
                <td colSpan={3}>No data for this range.</td>
              </tr>
            ) : (
              paginatedStats.map(stat => (
                <tr key={stat._id}>
                  <td>{stat.game?.title || 'Unknown Game'}</td>
                  <td>{formatDuration((stat.totalMinutes))}</td>
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