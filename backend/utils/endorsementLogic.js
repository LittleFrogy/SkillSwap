function canCreateEndorsement(session, fromUserId, toUserId, existingEndorsements = [], sessionId = null) {
  if (!session || session.status !== 'completed') return false;

  const participantIds = (session.participants || []).map((participant) => participant.userId);
  const isParticipant = participantIds.includes(fromUserId) && participantIds.includes(toUserId);
  if (!isParticipant) return false;

  const duplicate = existingEndorsements.some((item) => item.sessionId === sessionId || item.fromUserId === fromUserId);
  return !duplicate;
}

function summarizeEndorsement(endorsement) {
  return {
    id: endorsement._id,
    skill: endorsement.skill,
    endorsementType: endorsement.endorsementType,
    comment: endorsement.comment,
    visible: endorsement.visible !== false,
    createdAt: endorsement.createdAt,
    fromUserName: endorsement.fromUserName || 'Anonymous',
    toUserName: endorsement.toUserName || 'Unknown',
    toUserId: endorsement.toUserId,
    fromUserId: endorsement.fromUserId,
    sessionId: endorsement.sessionId
  };
}

module.exports = {
  canCreateEndorsement,
  summarizeEndorsement
};
