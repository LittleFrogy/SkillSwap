const axios = require('axios');
const User = require('../models/User');
const Post = require('../models/Post');
const MatchRequest = require('../models/MatchRequest');
const CreditTransaction = require('../models/CreditTransaction');


const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

/**
 * Send a session reminder push notification to both participants.
 * @param {Object} session - Mongoose Session document (populated with teacherId & learnerId)
 */
async function sendSessionReminder(session) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restApiKey) {
    console.warn('OneSignal env vars not set — skipping push notification.');
    return;
  }

  const teacher = session.teacherId?.oneSignalPlayerId !== undefined
    ? session.teacherId
    : await User.findById(session.teacherId);
  const learner = session.learnerId?.oneSignalPlayerId !== undefined
    ? session.learnerId
    : await User.findById(session.learnerId);

  // Collect Player IDs for both participants
  const playerIds = [];
  if (teacher?.oneSignalPlayerId) playerIds.push(teacher.oneSignalPlayerId);
  if (learner?.oneSignalPlayerId) playerIds.push(learner.oneSignalPlayerId);

  if (playerIds.length === 0) {
    console.log(`No OneSignal Player IDs found for session ${session._id} — push skipped.`);
    return;
  }

  const skillName = session.skill || 'a skill';
  const scheduledAt = new Date(session.scheduledTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });

  const payload = {
    app_id: appId,
    include_player_ids: playerIds,
    headings: { en: 'Session Starting Soon!' },
    contents: {
      en: `Your SkillSwap session on "${skillName}" starts in 30 minutes (${scheduledAt} UTC). Get ready!`
    },
    url: `${process.env.FRONTEND_URL || 'https://skillswap.app'}/sessions`,
    buttons: [
      { id: 'join', text: 'Join Session' }
    ],
    ttl: 1800 // Notification expires after 30 min if not delivered
  };

  try {
    const response = await axios.post(ONESIGNAL_API_URL, payload, {
      headers: {
        Authorization: `Basic ${restApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Push sent for session ${session._id} → recipients: ${response.data.recipients}`);
  } catch (err) {
    console.error('OneSignal push error:', err.response?.data || err.message);
  }
}

const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendWeeklyDigest() {
  const apiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
  const senderName = process.env.RESEND_SENDER_NAME || 'SkillSwap';
  const frontendUrl = process.env.FRONTEND_URL || 'https://skillswap.app';

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping weekly digest.');
    return;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let topPosts = [];
  try {
    const recentPosts = await Post.find({ createdAt: { $gte: sevenDaysAgo } }).lean();
    topPosts = recentPosts
      .map(p => ({
        ...p,
        reactionCount:
          (p.reactions?.like?.length || 0) +
          (p.reactions?.helpful?.length || 0) +
          (p.reactions?.insightful?.length || 0)
      }))
      .sort((a, b) => b.reactionCount - a.reactionCount)
      .slice(0, 3);
  } catch (err) {
    console.error('Weekly digest — error fetching posts:', err.message);
  }

  let users = [];
  try {
    users = await User.find({}, 'fullName email skillCredits oneSignalPlayerId').lean();
  } catch (err) {
    console.error('Weekly digest — error fetching users:', err.message);
    return;
  }

  for (const user of users) {
    if (!user.email || user.email.includes('@skillswap.local') || user.email.includes('@demo.local')) continue;

    try {
      const creditTxs = await CreditTransaction.find({
        userId: user._id.toString(),
        type: { $in: ['earned', 'grant'] },
        createdAt: { $gte: sevenDaysAgo }
      }).lean();
      const creditsEarned = creditTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const newMatches = await MatchRequest.find({
        $or: [{ fromUserId: user._id.toString() }, { toUserId: user._id.toString() }],
        status: 'accepted',
        createdAt: { $gte: sevenDaysAgo }
      }).lean();

      // Build HTML email
      const htmlBody = buildDigestHTML({
        user,
        topPosts,
        creditsEarned,
        newMatchCount: newMatches.length,
        frontendUrl
      });

      const emailPayload = {
        from: `${senderName} <${senderEmail}>`,
        to: [user.email],
        subject: `Your SkillSwap Weekly Digest — ${getWeekRange()}`,
        html: htmlBody
      };

      await axios.post(RESEND_API_URL, emailPayload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Weekly digest sent to ${user.email}`);

      // Small delay to respect Resend rate limits (100 emails/s on free plan)
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error(`Weekly digest error for ${user.email}:`, err.response?.data || err.message);
    }
  }

  console.log(`Weekly digest job complete — processed ${users.length} users.`);
}

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(now)}`;
}

function buildDigestHTML({ user, topPosts, creditsEarned, newMatchCount, frontendUrl }) {
  const firstName = (user.fullName || 'there').split(' ')[0];

  const postsHTML = topPosts.length > 0
    ? topPosts.map(p => `
        <tr>
          <td style="padding:12px 0; border-bottom:1px solid #2a2a4a;">
            <p style="margin:0 0 4px; font-weight:600; color:#e2e8f0; font-size:14px;">
              ${escapeHtml(p.content.slice(0, 120))}${p.content.length > 120 ? '…' : ''}
            </p>
            <p style="margin:0; font-size:12px; color:#8b8fb0;">
              by ${escapeHtml(p.authorName)} · ${p.reactionCount} reactions
            </p>
          </td>
        </tr>`).join('')
    : '<tr><td style="padding:12px 0; color:#8b8fb0; font-size:14px;">No community posts this week yet. Be the first to share!</td></tr>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SkillSwap Weekly Digest</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d1a; font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d1a; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px; width:100%; background:#13132a; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.4);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #6c3de0 0%, #4f9ef8 100%); padding:40px 32px; text-align:center;">
              <h1 style="margin:0 0 8px; font-size:28px; font-weight:800; color:#fff; letter-spacing:-0.5px;">
                ⚡ SkillSwap
              </h1>
              <p style="margin:0; font-size:15px; color:rgba(255,255,255,0.85);">
                Your Weekly Learning Digest · ${getWeekRange()}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 32px 0;">
              <h2 style="margin:0 0 8px; font-size:22px; color:#e2e8f0;">Hey ${escapeHtml(firstName)} 👋</h2>
              <p style="margin:0; font-size:15px; color:#8b8fb0; line-height:1.6;">
                Here's what happened in your SkillSwap community this week. Keep the momentum going!
              </p>
            </td>
          </tr>

          <!-- Stats row -->
          <tr>
            <td style="padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Credits earned -->
                  <td width="48%" style="background:#1a1a3e; border-radius:12px; padding:20px; text-align:center;">
                    <p style="margin:0 0 4px; font-size:32px; font-weight:800;
                               background:linear-gradient(135deg,#f6c90e,#ff8c42);
                               -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
                      +${creditsEarned}
                    </p>
                    <p style="margin:0; font-size:13px; color:#8b8fb0;">Credits Earned</p>
                  </td>
                  <td width="4%"></td>
                  <!-- New matches -->
                  <td width="48%" style="background:#1a1a3e; border-radius:12px; padding:20px; text-align:center;">
                    <p style="margin:0 0 4px; font-size:32px; font-weight:800;
                               background:linear-gradient(135deg,#6c3de0,#4f9ef8);
                               -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
                      ${newMatchCount}
                    </p>
                    <p style="margin:0; font-size:13px; color:#8b8fb0;">New Matches</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 32px;"><hr style="border:none; border-top:1px solid #2a2a4a;" /></td></tr>

          <!-- Community Posts -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <h3 style="margin:0 0 16px; font-size:17px; color:#e2e8f0;">🔥 Trending Community Posts</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${postsHTML}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:32px; text-align:center;">
              <a href="${frontendUrl}"
                 style="display:inline-block; padding:14px 36px; background:linear-gradient(135deg,#6c3de0,#4f9ef8);
                        color:#fff; font-size:15px; font-weight:700; text-decoration:none;
                        border-radius:50px; letter-spacing:0.3px;">
                Open SkillSwap Dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d0d1a; padding:24px 32px; text-align:center; border-top:1px solid #2a2a4a;">
              <p style="margin:0; font-size:12px; color:#555580; line-height:1.6;">
                You're receiving this because you have a SkillSwap account.<br/>
                © ${new Date().getFullYear()} SkillSwap · Keep learning, keep growing.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  sendSessionReminder,
  sendWeeklyDigest,
  getWeekRange,
  escapeHtml,
  buildDigestHTML
};
