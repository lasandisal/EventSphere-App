/* Floating "EventSphere Assistant" — injected once per page.
   Calls AssistantAPI.chat(); falls back to a canned response using
   EsMock so the widget is fully demoable without a backend. */
(function () {
  function injectMarkup() {
    if (document.getElementById('aiFab')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <button class="ai-fab" id="aiFab" aria-label="Open EventSphere Assistant">
        <span class="sparkle" style="width:1.5em;height:1.5em;">${EsIcons.sparkle}</span>
      </button>
      <div class="ai-panel" id="aiPanel">
        <div class="ai-header">
          <span class="sparkle" style="color:var(--dusty-rose-dark);width:1.3em;height:1.3em;">${EsIcons.sparkle}</span>
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
      <div class="fw-semibold" style="font-family:var(--font-display);font-size:1rem;">${ev.title}</div>
      <div class="text-muted-soft" style="font-size:0.78rem;">${ev.date} · ${ev.venue}</div>
      <a href="/pages/event-details.html?id=${ev.id}" class="btn btn-quiet btn-sm mt-2">View Event</a>
    </div>`;
  }

  function addMessage(text, who) {
    const body = document.getElementById('aiBody');
    const div = document.createElement('div');
    div.className = `ai-msg ${who}`;
    div.innerHTML = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  async function handlePrompt(prompt) {
    addMessage(prompt, 'user');
    document.getElementById('aiInput').value = '';

    try {
      const res = await AssistantAPI.chat(prompt);
      addMessage(res.reply || "Here's what I found ✨", 'bot');
      (res.events || []).forEach(ev => addMessage(eventMiniCard(ev), 'bot'));
    } catch (err) {
      // Demo-mode fallback
      const lower = prompt.toLowerCase();
      if (lower.includes('book')) {
        addMessage("Here's a quick look at your bookings — you can see the full list on My Bookings.", 'bot');
      } else {
        const matches = EsMock.events.filter(e =>
          lower.includes('music') ? e.category === 'Music' :
          lower.includes('tech') ? e.category === 'Technology' : true
        ).slice(0, 2);
        addMessage('I found a few events that might be your thing ✨', 'bot');
        matches.forEach(ev => addMessage(eventMiniCard(ev), 'bot'));
      }
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
