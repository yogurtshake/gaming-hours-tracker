require('dotenv').config();
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const User = require('./models/User')
const Session = require('./models/Session')
require('./models/Game')

const MONGO_URI = process.env.MONGO_URI;
const SMTP_SERVER = process.env.SMTP_SERVER;
const SMTP_PORT = Number(process.env.SMTP_PORT);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

async function getWeeklyStatsForUser(userId) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const sessions = await Session.find({
    user: userId,
    startTime: { $lte: now },
    endTime: { $gte: weekAgo }
  }).populate('game');

  if (!sessions.length) {
    return "You have no gaming sessions recorded in the past week.";
  }

  let totalMinutes = 0;
  const sessionsByDay = {};
  const perGameStats = {};

  sessions.forEach(s => {
    const sStart = new Date(Math.max(new Date(s.startTime).getTime(), weekAgo.getTime()));
    const sEnd = new Date(Math.min(new Date(s.endTime).getTime(), now.getTime()));

    if (sStart >= sEnd) return;

    let segStart = new Date(sStart);

    while (segStart < sEnd) {
      const nextDay = new Date(segStart);
      nextDay.setHours(24, 0, 0, 0);

      const segEnd = sEnd < nextDay ? sEnd : nextDay;
      const minutes = (segEnd.getTime() - segStart.getTime()) / 60000;

      const dayLabel = segStart.toLocaleDateString('en-CA');
      sessionsByDay[dayLabel] = (sessionsByDay[dayLabel] || 0) + minutes;
      totalMinutes += minutes;

      const game = s.game || { _id: 'unknown', title: 'Unknown Game' };
      const gameId = String(game._id);
      if (!perGameStats[gameId]) {
        perGameStats[gameId] = { game, totalMinutes: 0, sessions: 0 };
      }
      perGameStats[gameId].totalMinutes += minutes;
      perGameStats[gameId].sessions += 1;

      segStart = nextDay;
    }
  });

  const weeklyGoal = (await User.findById(userId)).goalPerDay * 7 * 60;

  let report = `Here are your weekly gaming playtime stats:\n\n`;

  report += `TIME PLAYED: ${formatDuration(totalMinutes)}\n`;
  report += `WEEKLY LIMIT: ${formatDuration(weeklyGoal)}\n\n${weeklyGoal >= totalMinutes ? 'Good job staying within your limit!' : 'You exceeded your limit.'}\n\n`;

  report += `TIME PER DAY:\n`;
  Object.keys(sessionsByDay).sort().forEach(day => {
    report += `  ${day}: ${formatDuration(Math.round(sessionsByDay[day]))}\n`;
  });

  report += `\nTIME PER GAME:\n`;
  const gameStatsArr = Object.values(perGameStats).sort((a, b) => b.totalMinutes - a.totalMinutes);
  gameStatsArr.forEach(g => {
    report += `  ${g.game.title || 'Unknown'} - ${formatDuration(Math.round(g.totalMinutes))} (${g.sessions} session${g.sessions !== 1 ? 's' : ''})\n`;
  });
  
  return report;
}


async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const transporter = nodemailer.createTransport({
    host: SMTP_SERVER,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const users = await User.find({ email: { $exists: true, $ne: '' } });

  for (const user of users) {
    try {
      const stats = await getWeeklyStatsForUser(user._id);
      const mailOptions = {
        from: SMTP_FROM,
        to: user.email,
        subject: 'Your Weekly Gaming Playtime Report - Gaming Hours Tracker',
        text: `Hi ${user.username},\n\n${stats}\nTot ziens.\n\nhttps://lucas.su-keun.kim/gaming-hours-tracker\n*to unsubscribe, log in and remove your email address in settings.`,
      };
      transporter.sendMail(mailOptions);
      console.log(`Sent stats to ${user.email}`);
    } catch (err) {
      console.error(`Failed to send to ${user.email}:`, err);
    }
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});