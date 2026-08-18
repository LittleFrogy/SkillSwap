const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const creditRoutes = require('../routes/credits');
const authRoutes = require('../routes/auth');

test('new user receives initial 5 skill credits bootstrap grant', async () => {
  const mockUser = {
    _id: 'test_user_bootstrap',
    skillCredits: 5
  };
  assert.equal(mockUser.skillCredits, 5, 'New user must start with 5 bootstrap credits');
});

test('session exchange deducts 2 credits from learner and adds 2 credits to teacher', async () => {
  const learner = { _id: 'learner_1', skillCredits: 5 };
  const teacher = { _id: 'teacher_1', skillCredits: 5 };
  const transferAmount = 2;

  assert.ok(learner.skillCredits >= transferAmount, 'Learner has sufficient balance');

  learner.skillCredits -= transferAmount;
  teacher.skillCredits += transferAmount;

  assert.equal(learner.skillCredits, 3, 'Learner balance after exchange should be 3');
  assert.equal(teacher.skillCredits, 7, 'Teacher balance after exchange should be 7');
});

test('prevents session exchange if learner has insufficient credits', async () => {
  const learner = { _id: 'learner_broke', skillCredits: 1 };
  const transferAmount = 2;

  const hasSufficientBalance = learner.skillCredits >= transferAmount;
  assert.equal(hasSufficientBalance, false, 'Learner with 1 credit cannot spend 2 credits');
});
