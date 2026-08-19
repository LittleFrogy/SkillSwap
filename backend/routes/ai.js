const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const User = require("../models/User");
const Session = require("../models/Session");
const Endorsement = require("../models/Endorsement");
const CreditTransaction = require("../models/CreditTransaction");
const Listing = require("../models/Listing");

const BADGE_DEFINITIONS = [
  { id: "first_session",        name: "First Step",         icon: "🚀", criteria: "complete 1 session",                         getProgress: (s) => ({ current: Math.min(s.totalSessions, 1),        target: 1  }) },
  { id: "five_sessions_taught", name: "Mentor",             icon: "🎓", criteria: "teach 5 sessions",                           getProgress: (s) => ({ current: Math.min(s.sessionsTaught, 5),       target: 5  }) },
  { id: "ten_sessions_taught",  name: "Master Teacher",     icon: "🏫", criteria: "teach 10 sessions",                          getProgress: (s) => ({ current: Math.min(s.sessionsTaught, 10),      target: 10 }) },
  { id: "polyglot",             name: "Polyglot",           icon: "🌐", criteria: "list 3+ different skills to teach",           getProgress: (s) => ({ current: Math.min(s.uniqueTeachSkills, 3),    target: 3  }) },
  { id: "well_endorsed",        name: "Well Endorsed",      icon: "⭐", criteria: "receive 5+ endorsements",                    getProgress: (s) => ({ current: Math.min(s.endorsementsReceived, 5),  target: 5  }) },
  { id: "community_champion",   name: "Community Champion", icon: "🏆", criteria: "receive 10+ endorsements",                   getProgress: (s) => ({ current: Math.min(s.endorsementsReceived, 10), target: 10 }) },
  { id: "credit_collector",     name: "Credit Collector",   icon: "🪙", criteria: "earn 20+ skill credits",                     getProgress: (s) => ({ current: Math.min(s.totalEarned, 20),         target: 20 }) },
  { id: "top_earner",           name: "Top Earner",         icon: "💎", criteria: "earn 50+ skill credits",                     getProgress: (s) => ({ current: Math.min(s.totalEarned, 50),         target: 50 }) },
  { id: "consistent",           name: "Consistent",         icon: "📅", criteria: "complete sessions across 2+ different weeks", getProgress: (s) => ({ current: Math.min(s.activeWeeks, 2),          target: 2  }) },
];

router.post("/progress-report", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required." });

    const isObjectId = mongoose.Types.ObjectId.isValid(String(userId));
    const user = isObjectId
      ? await User.findById(userId).select("-password")
      : await User.findOne({ _id: userId }).select("-password").catch(() => null);

    if (!user) return res.status(404).json({ message: "User not found. Please sign in again." });

    let allSessions = [];
    if (isObjectId) {
      allSessions = await Session.find({ $or: [{ teacherId: userId }, { learnerId: userId }] })
        .populate("teacherId", "fullName").populate("learnerId", "fullName").sort({ scheduledTime: -1 });
    }

    const completedSessions = allSessions.filter(s => s.status === "completed" || new Date(s.scheduledTime) < new Date());
    const sessionsTaught  = completedSessions.filter(s => s.teacherId?._id?.toString() === String(userId)).length;
    const sessionsLearned = completedSessions.filter(s => s.learnerId?._id?.toString() === String(userId)).length;

    const recentSessions = completedSessions.slice(0, 3).map(s => {
      const isTeacher = s.teacherId?._id?.toString() === String(userId);
      return { skill: s.skill, role: isTeacher ? "teacher" : "learner", partner: isTeacher ? s.learnerId?.fullName : s.teacherId?.fullName, date: s.scheduledTime };
    });

    const uniqueSessionSkills = [...new Set(completedSessions.map(s => s.skill).filter(Boolean))];
    const weekKeys = new Set(completedSessions.map(s => { const d = new Date(s.scheduledTime); const soy = new Date(d.getFullYear(),0,1); return `${d.getFullYear()}-W${Math.ceil(((d-soy)/86400000+soy.getDay()+1)/7)}`; }));
    const activeWeeks = weekKeys.size;

    const endorsements = await Endorsement.find({ toUserId: String(userId) }).sort({ createdAt: -1 });
    const endorsementsReceived = endorsements.length;
    const topEndorsedSkills = Object.entries(endorsements.reduce((acc,e) => { if(e.skill) acc[e.skill]=(acc[e.skill]||0)+1; return acc; }, {})).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([s])=>s);
    const recentEndorsement = endorsements[0] ? { skill: endorsements[0].skill, comment: endorsements[0].comment, from: endorsements[0].fromUserName } : null;

    const creditTxs = await CreditTransaction.find({ userId: String(userId) });
    const totalEarned = creditTxs.filter(t => t.type === "earned" || t.type === "grant").reduce((s,t) => s+Number(t.amount||0), 0);
    const totalSpent  = creditTxs.filter(t => t.type === "spent").reduce((s,t) => s+Number(t.amount||0), 0);

    const listings = await Listing.find({ userId: String(userId) });
    const teachSkills   = [...new Set(listings.filter(l=>l.type==="teach").map(l=>l.skill).filter(Boolean))];
    const learnWishlist = listings.filter(l=>l.type==="learn").map(l=>l.skill).filter(Boolean);

    const stats = { totalSessions: completedSessions.length, sessionsTaught, endorsementsReceived, totalEarned, uniqueTeachSkills: teachSkills.length, activeWeeks };
    const earnedBadgeIds = new Set((user.badges||[]).map(b=>typeof b==="string"?b:b?.id).filter(Boolean));
    const badgeProgress = BADGE_DEFINITIONS.map(def => { const earned=earnedBadgeIds.has(def.id); const {current,target}=def.getProgress(stats); return {...def,earned,current,target,pct:target>0?Math.round(current/target*100):0}; });
    const earnedBadges = badgeProgress.filter(b=>b.earned);
    const closestBadge = badgeProgress.filter(b=>!b.earned).sort((a,b)=>b.pct-a.pct)[0]||null;

    const snapshot = {
      name: user.fullName||"SkillSwap User", jobTitle: user.jobTitle||"learner",
      skillsOffered: teachSkills, learningWishlist: learnWishlist,
      sessionsStats: { total: completedSessions.length, taught: sessionsTaught, learned: sessionsLearned },
      uniqueSkillsCovered: uniqueSessionSkills, recentSessions,
      endorsementsReceived, topEndorsedSkills, recentEndorsement,
      credits: { balance: user.skillCredits||0, totalEarned, totalSpent },
      earnedBadges: earnedBadges.map(b=>b.name),
      closestBadge: closestBadge ? { name: closestBadge.name, icon: closestBadge.icon, progress: `${closestBadge.current}/${closestBadge.target}`, pct: closestBadge.pct, criteria: closestBadge.criteria } : null
    };

    const prompt = `You are SkillSwap's personal progress coach — warm, encouraging, and data-driven.
Analyse the user's SkillSwap activity snapshot below and write a personalised progress report.

USER SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

Return ONLY a valid JSON object with exactly these fields:
{
  "headline": "A punchy 6-10 word headline celebrating their journey (use their first name)",
  "summary": "2 sentences: where they stand overall and one specific highlight from their data",
  "strengths": ["strength 1 (specific, reference actual skills/numbers)", "strength 2", "strength 3"],
  "recentWin": "One sentence celebrating a specific recent achievement — be precise and personal",
  "nextBadge": {
    "name": "badge name or All caught up!",
    "icon": "emoji icon",
    "gap": "Exactly what they need to do — e.g. Teach 2 more sessions",
    "action": "One concrete, friendly next-step sentence"
  },
  "recommendation": "A specific recommendation for who or what they should schedule next",
  "motivationalClose": "A short (1 sentence) inspiring sign-off personalised to their journey"
}

Rules:
- Use their first name naturally.
- Reference actual numbers, skill names, and badge names from the snapshot.
- Tone: supportive mentor, not corporate bot.
- If they have zero sessions, encourage them to book their first.
- Return ONLY the JSON — no markdown, no code fences, no extra text.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return res.status(503).json({ message: "GEMINI_API_KEY is not configured. Add your key to backend/.env and restart the server.", missingKey: true });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: "application/json", temperature: 0.85, maxOutputTokens: 1024 } });

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    if (!raw) throw new Error("Gemini returned an empty response.");

    let report;
    try { report = JSON.parse(raw); }
    catch { report = JSON.parse(raw.replace(/`+json|`+/gi, "").trim()); }

    if (!report || !report.headline || !report.summary) throw new Error("Gemini returned an incomplete report. Please try again.");

    return res.json({ report, generatedAt: new Date().toISOString(), snapshot: { totalSessions: completedSessions.length, sessionsTaught, sessionsLearned, endorsementsReceived, creditsEarned: totalEarned, badgesEarned: earnedBadges.length } });

  } catch (err) {
    console.error("AI progress report error:", err.message);
    if (err.message?.includes("API_KEY") || err.message?.includes("API key") || err.status === 401) {
      return res.status(401).json({ message: "Invalid Gemini API key. Check GEMINI_API_KEY in your backend .env file.", missingKey: true });
    }
    return res.status(500).json({ message: "Failed to generate progress report: " + err.message });
  }
});

module.exports = router;