/* Floating "EventSphere Assistant" — powered by Google Gemini API.
   Communicates with AssistantController (/api/v1/assistant/chat). */
(function () {
  // Ensure AssistantAPI is always available even if organizer.js wasn't explicitly loaded on this page
  if (typeof window !== 'undefined' && !window.AssistantAPI) {
    window.AssistantAPI = {
      chat(message, context) {
        if (typeof esFetch === 'function') {
          return esFetch('/assistant/chat', { method: 'POST', body: { message, context } });
        }
        return Promise.reject(new Error('API fetch wrapper not initialized'));
      }
    };
  }

  function injectMarkup() {
    if (document.getElementById('aiFab')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <button class="ai-fab" id="aiFab" aria-label="Open EventSphere Assistant">
        <i class="bi bi-chat-dots-fill" style="font-size: 1.55rem; color: #FFFFFF;"></i>
      </button>
      <div class="ai-panel" id="aiPanel">
        <div class="ai-header">
          <i class="bi bi-chat-dots-fill me-2" style="color: var(--neon-rose); font-size: 1.25rem;"></i>
          <div>
            <div class="t">EventSphere Assistant</div>
            <div class="s">Let me help you find something you'll love.</div>
          </div>
          <button class="btn-close ms-auto" id="aiClose" style="font-size:0.7rem;"></button>
        </div>
        <div class="ai-body" id="aiBody">
          <div class="ai-msg bot">Hi! Ask me to find events, check your bookings, or tell you about something you're viewing ✨</div>
        </div>
        <div class="ai-suggestions" id="aiSuggestions">
          <span class="ai-chip" data-prompt="Find events this weekend">Find events this weekend</span>
          <span class="ai-chip" data-prompt="Show me music events">Show me music events</span>
          <span class="ai-chip" data-prompt="What have I booked?">What have I booked?</span>
        </div>
        <div class="ai-input">
          <input type="text" id="aiInput" placeholder="Ask EventSphere Assistant..." />
          <button id="aiSend" aria-label="Send">➤</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
  }

  function eventMiniCard(ev) {
    return `<div class="mini-card">
      <div class="fw-semibold" style="font-family:var(--font-display);font-size:1rem;">${ev.title || 'Event'}</div>
      <div class="text-muted-soft" style="font-size:0.78rem;">${ev.date || ''} · ${ev.venue || ''}</div>
      <a href="${esPathPrefix().toPages}event-details.html?id=${ev.id}" class="btn btn-quiet btn-sm mt-2">View Event</a>
    </div>`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
  }

  function formatBotReply(reply) {
    if (!reply) return "Here's what I found ✨";
    return escapeHtml(reply).replace(/\\n/g, '<br>');
  }

  function addMessage(htmlContent, who) {
    const body = document.getElementById('aiBody');
    if (!body) return null;
    const div = document.createElement('div');
    div.className = `ai-msg ${who}`;
    div.innerHTML = htmlContent;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  async function handlePrompt(prompt) {
    if (!prompt || !prompt.trim()) return;
    const cleanPrompt = prompt.trim();
    addMessage(escapeHtml(cleanPrompt), 'user');
    const input = document.getElementById('aiInput');
    if (input) input.value = '';

    // Thinking indicator bubble
    const thinkingEl = addMessage(
      '<span class="spinner-border spinner-border-sm me-2" role="status" style="width:0.8rem; height:0.8rem;"></span>Thinking...',
      'bot'
    );

    try {
      const res = await window.AssistantAPI.chat(cleanPrompt);
      if (thinkingEl && thinkingEl.parentNode) thinkingEl.remove();
      
      const replyText = (res && typeof res === 'object') ? (res.reply || "Here's what I found ✨") : String(res);
      addMessage(formatBotReply(replyText), 'bot');

      if (res && Array.isArray(res.events)) {
        res.events.forEach(ev => addMessage(eventMiniCard(ev), 'bot'));
      }
    } catch (err) {
      if (thinkingEl && thinkingEl.parentNode) thinkingEl.remove();
      console.error('EventSphere Assistant Error:', err);
      addMessage("Sorry, I couldn't reach the AI assistant right now. Please check your connection and try again.", 'bot');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectMarkup();
    const fab = document.getElementById('aiFab');
    const panel = document.getElementById('aiPanel');
    fab.addEventListener('click', () => panel.classList.toggle('open'));
    document.getElementById('aiClose').addEventListener('click', () => panel.classList.remove('open'));
    document.getElementById('aiSend').addEventListener('click', () => {
      const val = document.getElementById('aiInput').value.trim();
      if (val) handlePrompt(val);
    });
    document.getElementById('aiInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('aiSend').click();
    });
    document.getElementById('aiSuggestions').addEventListener('click', (e) => {
      const chip = e.target.closest('.ai-chip');
      if (chip) handlePrompt(chip.getAttribute('data-prompt'));
    });
  });
})();
