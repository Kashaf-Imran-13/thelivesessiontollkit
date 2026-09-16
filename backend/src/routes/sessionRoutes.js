const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Health endpoint
router.get('/health', sessionController.getHealth);

// History & Archive endpoint (mounted before /:id)
router.get('/sessions/history', sessionController.getSessionHistory);

// Core Session CRUD
router.get('/sessions', sessionController.getAllSessions);
router.get('/sessions/:id', sessionController.getSessionById);
router.post('/sessions', sessionController.createSession);
router.post('/sessions/join', sessionController.joinSession);
router.patch('/sessions/:id/status', sessionController.updateSessionStatus);
router.delete('/sessions/:id', sessionController.deleteSession);

// Feature #1 & #3: Polls
router.get('/sessions/:id/polls', sessionController.getSessionPolls);
router.post('/sessions/:id/polls', sessionController.createPoll);
router.post('/sessions/:id/polls/:pollId/vote', sessionController.votePoll);
router.patch('/sessions/:id/polls/:pollId/close', sessionController.closePoll);

// Feature #5: Attendance & Participation Tracking
router.get('/sessions/:id/attendance', sessionController.getSessionAttendance);

// Feature #6: Q&A Module
router.get('/sessions/:id/qa', sessionController.getQAQuestions);
router.post('/sessions/:id/qa', sessionController.postQAQuestion);
router.post('/sessions/:id/qa/:questionId/upvote', sessionController.upvoteQAQuestion);
router.patch('/sessions/:id/qa/:questionId/answer', sessionController.toggleQAQuestionStatus);

// Feature #7: Session Results & Detailed Participant Breakdown
router.get('/sessions/:id/responses', sessionController.getSessionResponses);
router.get('/sessions/:id/export', sessionController.exportSessionReport);

// Feature #9: AI Session Insights
router.get('/sessions/:id/insights', sessionController.getAISessionInsights);

module.exports = router;
