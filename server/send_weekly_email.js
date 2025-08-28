require('dotenv').config();
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const User = require('./models/User')
const Session = require('./models/Session')

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
    startTime: { $gte: weekAgo, $lte: now }
  });

  if (!sessions.length) {
    return "You have no gaming sessions recorded in the past week.";
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  const sessionsByDay = {};
  sessions.forEach(s => {
    const day = s.startTime.toISOString().slice(0, 10);
    sessionsByDay[day] = (sessionsByDay[day] || 0) + (s.duration || 0);
  });

  let report = `Your Weekly Gaming Stats:\n\n`;
  report += `Total time played: ${formatDuration(totalMinutes)}\n\n`;
  report += `Breakdown by day:\n`;
  Object.keys(sessionsByDay).sort().forEach(day => {
    report += `  ${day}: ${formatDuration(sessionsByDay[day])}\n`;
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
        subject: 'Your Weekly Gaming Stats Report',
        text: `Hi${user.username ? ' ' + user.username : ''},\n\n${stats}\n\nHappy gaming!\n`,
      };
      await transporter.sendMail(mailOptions);
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