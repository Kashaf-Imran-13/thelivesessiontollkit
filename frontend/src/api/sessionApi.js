const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const sessionApi = {
  // 1. Get health status
  async checkHealth() {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch health:', err);
      return { success: false, error: err.message };
    }
  },

  // 2. Fetch all sessions
  async getSessions(filter = {}) {
    const params = new URLSearchParams();
    if (filter.status && filter.status !== 'all') params.append('status', filter.status);
    if (filter.search) params.append('search', filter.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/sessions${queryString}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch sessions (${res.status})`);
    }
    return await res.json();
  },

  // 3. Get single session
  async getSessionById(id) {
    const res = await fetch(`${BASE_URL}/sessions/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Session not found (${res.status})`);
    }
    return await res.json();
  },

  // 4. Create new session
  async createSession(sessionData) {
    const res = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create session (${res.status})`);
    }
    return await res.json();
  },

  // 5. Join existing session (with Email Gate)
  async joinSession({ session_code, participant_name, participant_email, role = 'attendee' }) {
    const res = await fetch(`${BASE_URL}/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_code, participant_name, participant_email, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to join session (${res.status})`);
    }
    return await res.json();
  },

  // 6. Update session status
  async updateStatus(id, status, actor_name = 'Host') {
    const res = await fetch(`${BASE_URL}/sessions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actor_name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to update status (${res.status})`);
    }
    return await res.json();
  },

  // 7. Delete session
  async deleteSession(id) {
    const res = await fetch(`${BASE_URL}/sessions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to delete session (${res.status})`);
    }
    return await res.json();
  },

  // 8. Polls: Get all polls
  async getPolls(sessionId) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/polls`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch polls (${res.status})`);
    }
    return await res.json();
  },

  // 9. Polls: Create & Launch Poll
  async createPoll(sessionId, pollData) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pollData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to launch poll (${res.status})`);
    }
    return await res.json();
  },

  // 10. Polls: Cast vote
  async votePoll(sessionId, pollId, voteData) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to submit vote (${res.status})`);
    }
    return await res.json();
  },

  // 11. Polls: Close Poll
  async closePoll(sessionId, pollId, hostName = 'Host') {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/polls/${pollId}/close`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_name: hostName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to close poll (${res.status})`);
    }
    return await res.json();
  },

  // 12. Feature #5: Attendance & Active Duration Tracking
  async getAttendance(sessionId) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/attendance`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to load attendance (${res.status})`);
    }
    return await res.json();
  },

  // 13. Feature #6: Q&A Module
  async getQA(sessionId) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/qa`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to load questions (${res.status})`);
    }
    return await res.json();
  },

  async postQA(sessionId, data) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to submit question (${res.status})`);
    }
    return await res.json();
  },

  async upvoteQA(sessionId, questionId, data) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/qa/${questionId}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to upvote question (${res.status})`);
    }
    return await res.json();
  },

  async toggleQAStatus(sessionId, questionId, data) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/qa/${questionId}/answer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to update question status (${res.status})`);
    }
    return await res.json();
  },

  // 14. Feature #7: Participant-level response logs & Exports
  async getResponses(sessionId) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/responses`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch response logs (${res.status})`);
    }
    return await res.json();
  },

  async exportReport(sessionId, format = 'json') {
    if (format === 'csv') {
      window.open(`${BASE_URL}/sessions/${sessionId}/export?format=csv`, '_blank');
      return;
    }
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/export?format=json`);
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    return await res.json();
  },

  // 15. Feature #8: Session History & Analytics Archives
  async getHistory() {
    const res = await fetch(`${BASE_URL}/sessions/history`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to load history (${res.status})`);
    }
    return await res.json();
  },

  // 16. Feature #9: AI Session Insights
  async getAIInsights(sessionId) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/insights`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to load AI insights (${res.status})`);
    }
    return await res.json();
  },
};
