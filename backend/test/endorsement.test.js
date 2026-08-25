const test = require('node:test');
const assert = require('node:assert/strict');
const { canCreateEndorsement, summarizeEndorsement } = require('../utils/endorsementLogic');

test('allows one endorsement for a completed session', () => {
  const session = { status: 'completed', participants: [{ userId: 'u1' }, { userId: 'u2' }] };
  const existing = [];

  assert.equal(canCreateEndorsement(session, 'u1', 'u2', existing), true);
});

test('rejects duplicate endorsements for the same session', () => {
  const session = { status: 'completed', participants: [{ userId: 'u1' }, { userId: 'u2' }] };
  const existing = [{ fromUserId: 'u1', sessionId: 's1' }];

  assert.equal(canCreateEndorsement(session, 'u1', 'u2', existing, 's1'), false);
});

test('rejects endorsements for incomplete sessions', () => {
  const session = { status: 'scheduled', participants: [{ userId: 'u1' }, { userId: 'u2' }] };
  const existing = [];

  assert.equal(canCreateEndorsement(session, 'u1', 'u2', existing), false);
});

test('summarizes an endorsement for display', () => {
  const summary = summarizeEndorsement({
    skill: 'Python Programming',
    endorsementType: 'Great Mentor',
    comment: 'Excellent teaching',
    createdAt: '2026-08-04T12:00:00.000Z',
    visible: true,
    fromUserName: 'Bob'
  });

  assert.equal(summary.skill, 'Python Programming');
  assert.equal(summary.endorsementType, 'Great Mentor');
  assert.equal(summary.comment, 'Excellent teaching');
  assert.equal(summary.visible, true);
});
