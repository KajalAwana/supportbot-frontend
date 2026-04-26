(function () {
  'use strict';

  // Find script tag to get config
  const scriptTag = document.currentScript || (function () {
    const scripts = document.querySelectorAll('script[data-bot-key]');
    return scripts[scripts.length - 1];
  })();

  const BOT_KEY = scriptTag?.getAttribute('data-bot-key');
  const API_URL = scriptTag?.getAttribute('data-api-url') || 'https://your-backend.railway.app/api';

  if (!BOT_KEY) {
    console.warn('[SupportBot] No data-bot-key found on script tag.');
    return;
  }

  let botConfig = null;
  let conversationHistory = [];
  let isOpen = false;
  let isLoading = false;

  // Fetch bot config
  async function fetchBot() {
    try {
      const res = await fetch(`${API_URL}/bots/embed/${BOT_KEY}`);
      if (!res.ok) throw new Error('Bot not found');
      const data = await res.json();
      botConfig = data.bot;
      renderWidget();
    } catch (e) {
      console.warn('[SupportBot] Could not load bot config:', e.message);
    }
  }

  // Styles
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #sb-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; }
      #sb-bubble {
        position: fixed; bottom: 24px; right: 24px; z-index: 99999;
        width: 56px; height: 56px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; border: none;
        box-shadow: 0 4px 20px rgba(0,0,0,.2);
        transition: transform .2s, box-shadow .2s;
      }
      #sb-bubble:hover { transform: scale(1.08); box-shadow: 0 8px 30px rgba(0,0,0,.25); }
      #sb-bubble svg { transition: transform .3s; }
      #sb-bubble.open svg.sb-chat { display: none; }
      #sb-bubble.open svg.sb-close { display: block !important; }
      #sb-panel {
        position: fixed; bottom: 92px; right: 24px; z-index: 99998;
        width: 360px; height: 500px;
        background: white; border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,.18);
        display: flex; flex-direction: column; overflow: hidden;
        transform: scale(0.92) translateY(12px); opacity: 0;
        pointer-events: none;
        transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
        transform-origin: bottom right;
      }
      #sb-panel.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }
      .sb-header {
        padding: 14px 16px; display: flex; align-items: center; gap: 10px; color: white; flex-shrink: 0;
      }
      .sb-header-avatar {
        width: 34px; height: 34px; background: rgba(255,255,255,.2);
        border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .sb-header-name { font-weight: 600; font-size: 14px; }
      .sb-header-status { font-size: 11px; opacity: .8; display: flex; align-items: center; gap: 4px; margin-top: 1px; }
      .sb-dot { width: 7px; height: 7px; background: #4ade80; border-radius: 50%; }
      .sb-messages {
        flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px;
        background: #f7f7fb;
      }
      .sb-messages::-webkit-scrollbar { width: 4px; }
      .sb-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
      .sb-msg { display: flex; gap: 7px; align-items: flex-end; }
      .sb-msg.user { flex-direction: row-reverse; }
      .sb-msg-avatar {
        width: 26px; height: 26px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: white; flex-shrink: 0; font-size: 11px; font-weight: 700;
      }
      .sb-bubble-text {
        max-width: 78%; padding: 9px 13px; border-radius: 16px;
        font-size: 13.5px; line-height: 1.5; word-break: break-word;
      }
      .sb-msg.bot .sb-bubble-text {
        background: white; border: 1px solid #e4e4f0; border-bottom-left-radius: 4px;
        color: #1a1a2e;
      }
      .sb-msg.user .sb-bubble-text { color: white; border-bottom-right-radius: 4px; }
      .sb-typing { display: flex; gap: 5px; align-items: center; padding: 12px 14px; }
      .sb-typing span {
        width: 7px; height: 7px; background: #c4c4d4; border-radius: 50%;
        animation: sb-pulse 1s ease infinite;
      }
      .sb-typing span:nth-child(2) { animation-delay: .18s; }
      .sb-typing span:nth-child(3) { animation-delay: .36s; }
      @keyframes sb-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
      .sb-footer { padding: 10px 12px; border-top: 1px solid #e4e4f0; background: white; flex-shrink: 0; }
      .sb-input-row { display: flex; gap: 8px; align-items: center; }
      .sb-input {
        flex: 1; padding: 9px 14px; border: 1.5px solid #e4e4f0; border-radius: 99px;
        font-size: 13.5px; outline: none; transition: border-color .2s;
      }
      .sb-input:focus { border-color: var(--sb-color, #5b4cf6); }
      .sb-send {
        width: 36px; height: 36px; border-radius: 50%; border: none;
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        transition: opacity .2s; flex-shrink: 0; color: white;
      }
      .sb-send:hover { opacity: .85; }
      .sb-send:disabled { opacity: .4; cursor: not-allowed; }
      .sb-powered { text-align: center; font-size: 10px; color: #aaa; margin-top: 6px; }
      .sb-powered a { color: #aaa; text-decoration: none; }
      .sb-powered a:hover { text-decoration: underline; }
      @media (max-width: 420px) {
        #sb-panel { width: calc(100vw - 24px); right: 12px; bottom: 80px; }
        #sb-bubble { bottom: 16px; right: 16px; }
      }
    `;
    document.head.appendChild(style);
  }

  function renderWidget() {
    const color = botConfig?.theme_color || '#5b4cf6';
    const businessName = botConfig?.business_name || 'Support';
    const welcomeMsg = botConfig?.welcome_message || `Hi! I'm ${businessName}'s support bot. How can I help?`;

    const container = document.createElement('div');
    container.id = 'sb-widget';

    container.innerHTML = `
      <button id="sb-bubble" aria-label="Open support chat" style="background:${color}">
        <svg class="sb-chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg class="sb-close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="display:none">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div id="sb-panel" role="dialog" aria-label="${businessName} chat">
        <div class="sb-header" style="background:${color}">
          <div class="sb-header-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <div class="sb-header-name">${businessName}</div>
            <div class="sb-header-status"><span class="sb-dot"></span>Online</div>
          </div>
        </div>
        <div class="sb-messages" id="sb-messages"></div>
        <div class="sb-footer">
          <div class="sb-input-row">
            <input class="sb-input" id="sb-input" placeholder="Type a message…" autocomplete="off" />
            <button class="sb-send" id="sb-send" style="background:${color}" aria-label="Send">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p class="sb-powered">Powered by <a href="https://supportbot.ai" target="_blank">SupportBot AI</a></p>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Add welcome message
    addMessage('bot', welcomeMsg, color);

    // Event listeners
    document.getElementById('sb-bubble').addEventListener('click', togglePanel);
    document.getElementById('sb-send').addEventListener('click', sendMessage);
    document.getElementById('sb-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  function togglePanel() {
    isOpen = !isOpen;
    const panel = document.getElementById('sb-panel');
    const bubble = document.getElementById('sb-bubble');
    panel.classList.toggle('open', isOpen);
    bubble.classList.toggle('open', isOpen);
    if (isOpen) setTimeout(() => document.getElementById('sb-input')?.focus(), 250);
  }

  function addMessage(role, text, color) {
    const color_ = color || botConfig?.theme_color || '#5b4cf6';
    const msgs = document.getElementById('sb-messages');
    if (!msgs) return;

    const div = document.createElement('div');
    div.className = `sb-msg ${role}`;

    if (role === 'bot') {
      div.innerHTML = `
        <div class="sb-msg-avatar" style="background:${color_}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div class="sb-bubble-text">${escapeHtml(text)}</div>
      `;
    } else {
      div.innerHTML = `<div class="sb-bubble-text" style="background:${color_}">${escapeHtml(text)}</div>`;
    }

    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = document.getElementById('sb-messages');
    const el = document.createElement('div');
    el.className = 'sb-msg bot';
    el.id = 'sb-typing-indicator';
    el.innerHTML = `
      <div class="sb-msg-avatar" style="background:${botConfig?.theme_color || '#5b4cf6'}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div class="sb-bubble-text sb-typing"><span></span><span></span><span></span></div>
    `;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('sb-typing-indicator')?.remove();
  }

  async function sendMessage() {
    if (isLoading) return;
    const input = document.getElementById('sb-input');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    isLoading = true;
    document.getElementById('sb-send').disabled = true;

    addMessage('user', msg);
    conversationHistory.push({ role: 'user', content: msg });

    showTyping();

    try {
      const res = await fetch(`${API_URL}/chat/${BOT_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversation_history: conversationHistory.slice(-6)
        })
      });

      const data = await res.json();
      hideTyping();

      const reply = data.reply || "Sorry, I couldn't process that. Please try again.";
      addMessage('bot', reply);
      conversationHistory.push({ role: 'assistant', content: reply });
    } catch (e) {
      hideTyping();
      addMessage('bot', 'Sorry, something went wrong. Please try again later.');
    } finally {
      isLoading = false;
      document.getElementById('sb-send').disabled = false;
      input.focus();
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  // Init
  injectStyles();
  fetchBot();
})();
