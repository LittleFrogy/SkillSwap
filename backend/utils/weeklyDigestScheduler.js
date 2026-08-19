const cron = require('node-cron');
const { sendWeeklyDigest } = require('./notificationService');

function startWeeklyDigestScheduler() {
  // Cron: minute=0, hour=8, day-of-month=*, month=*, day-of-week=0 (Sunday)
  cron.schedule('0 8 * * 0', async () => {
    console.log('📧 Weekly digest scheduler triggered — sending emails...');
    try {
      await sendWeeklyDigest();
    } catch (err) {
      console.error('Weekly digest scheduler error:', err.message);
    }
  }, {
    name: 'weekly-digest',
    timezone: 'UTC',
    noOverlap: true
  });

  console.log('Weekly digest scheduler started (fires every Sunday at 08:00 UTC).');
}

module.exports = { startWeeklyDigestScheduler };
