const test = require('node:test');
const assert = require('node:assert/strict');
const { getReminderWindow } = require('../utils/sessionReminderScheduler');
const { escapeHtml, getWeekRange, buildDigestHTML } = require('../utils/notificationService');

test('reminder window is exactly 25–35 minutes ahead of now', () => {
  const now = new Date('2026-08-18T12:00:00.000Z');
  const { windowStart, windowEnd } = getReminderWindow(now);

  assert.equal(windowStart.toISOString(), '2026-08-18T12:25:00.000Z');
  assert.equal(windowEnd.toISOString(), '2026-08-18T12:35:00.000Z');
});

test('a session scheduled 30 minutes out falls inside the reminder window', () => {
  const now = new Date('2026-08-18T12:00:00.000Z');
  const { windowStart, windowEnd } = getReminderWindow(now);
  const scheduledTime = new Date(now.getTime() + 30 * 60 * 1000);

  assert.ok(scheduledTime >= windowStart && scheduledTime <= windowEnd);
});

test('a session scheduled 10 minutes out falls outside the reminder window', () => {
  const now = new Date('2026-08-18T12:00:00.000Z');
  const { windowStart, windowEnd } = getReminderWindow(now);
  const scheduledTime = new Date(now.getTime() + 10 * 60 * 1000);

  assert.equal(scheduledTime >= windowStart && scheduledTime <= windowEnd, false);
});

test('a session scheduled 60 minutes out falls outside the reminder window', () => {
  const now = new Date('2026-08-18T12:00:00.000Z');
  const { windowStart, windowEnd } = getReminderWindow(now);
  const scheduledTime = new Date(now.getTime() + 60 * 60 * 1000);

  assert.equal(scheduledTime >= windowStart && scheduledTime <= windowEnd, false);
});

test('escapeHtml neutralizes tags so a post/name can never break the email markup', () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const escaped = escapeHtml(malicious);

  assert.equal(escaped.includes('<img'), false);
  assert.equal(escaped, '&lt;img src=x onerror=alert(1)&gt;');
});

test('escapeHtml handles empty/undefined input without throwing', () => {
  assert.equal(escapeHtml(''), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(null), '');
});

test('getWeekRange returns a 7-day span ending today', () => {
  const range = getWeekRange();
  assert.match(range, /^[A-Za-z]{3} \d{1,2} – [A-Za-z]{3} \d{1,2}$/);
});

test('buildDigestHTML embeds the recipient first name and escapes post content', () => {
  const html = buildDigestHTML({
    user: { fullName: 'Alicia <script>Chen</script>' },
    topPosts: [
      { content: '<b>hello</b> world', authorName: 'Bob', reactionCount: 3 }
    ],
    creditsEarned: 4,
    newMatchCount: 2,
    frontendUrl: 'http://localhost:5173'
  });

  assert.ok(html.includes('Hey Alicia'), 'greets the user by first name');
  assert.equal(html.includes('<script>Chen</script>'), false, 'never injects raw HTML from fullName into the greeting');
  assert.equal(html.includes('<b>hello</b>'), false, 'post content is escaped, not rendered as HTML');
  assert.ok(html.includes('+4'), 'shows credits earned');
  assert.ok(/>\s*2\s*</.test(html), 'shows new match count');
});

test('buildDigestHTML falls back to "there" when fullName is missing', () => {
  const html = buildDigestHTML({
    user: {},
    topPosts: [],
    creditsEarned: 0,
    newMatchCount: 0,
    frontendUrl: 'http://localhost:5173'
  });

  assert.ok(html.includes('Hey there'));
});
