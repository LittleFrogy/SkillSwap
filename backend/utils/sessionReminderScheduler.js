const cron = require('node-cron');
const Session = require('../models/Session');
const { sendSessionReminder } = require('./notificationService');

function getReminderWindow(now = new Date()) {
  return {
    windowStart: new Date(now.getTime() + 25 * 60 * 1000), // now + 25 min
    windowEnd: new Date(now.getTime() + 35 * 60 * 1000)    // now + 35 min
  };
}

async function findSessionsDueForReminder(now = new Date()) {
  const { windowStart, windowEnd } = getReminderWindow(now);

  return Session.find({
    status: 'scheduled',
    reminderSent: false,
    scheduledTime: { $gte: windowStart, $lte: windowEnd }
  })
    .populate('teacherId', 'fullName oneSignalPlayerId')
    .populate('learnerId', 'fullName oneSignalPlayerId');
}

async function runReminderSweep() {
  const upcomingSessions = await findSessionsDueForReminder();

  if (upcomingSessions.length === 0) return;

  console.log(`Session reminder scheduler: found ${upcomingSessions.length} session(s) to notify.`);

  for (const session of upcomingSessions) {
    try {
      const claimed = await Session.findOneAndUpdate(
        { _id: session._id, reminderSent: false },
        { reminderSent: true },
        { new: true }
      );

      if (!claimed) continue;

      await sendSessionReminder(session);
    } catch (err) {

      console.error(`Failed to send reminder for session ${session._id}:`, err.message);
    }
  }
}

function startSessionReminderScheduler() {

  cron.schedule('*/5 * * * *', async () => {
    try {
      await runReminderSweep();
    } catch (err) {
      console.error('Session reminder scheduler error:', err.message);
    }
  }, {
    name: 'session-reminder-sweep',
    noOverlap: true
  });

  console.log('Session reminder scheduler started (runs every 5 minutes).');
}

module.exports = {
  startSessionReminderScheduler,
  findSessionsDueForReminder,
  runReminderSweep,
  getReminderWindow
};
