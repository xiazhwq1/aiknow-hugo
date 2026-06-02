/**
 * TTS 听书播放器 — 浏览器 Web Speech API
 * 适用于 AI Know 网站文章页（AI技术 / 有趣点子 / 等栏目）
 * 
 * 用法：页面引入此 JS，自动渲染 🔊 听书 浮动按钮
 * 自动提取 <article> 内文本朗读
 */
(function() {
  'use strict';

  if (window.__ttsPlayerInited) return;
  window.__ttsPlayerInited = true;

  // ========== 提取文章文本 ==========
  function getArticleText() {
    const article = document.querySelector('article');
    if (!article) return '';
    // 排除导航/按钮等干扰元素
    const clone = article.cloneNode(true);
    clone.querySelectorAll('nav, .tts-player, button, script, style, .site-nav, footer').forEach(el => el.remove());
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  }

  // ========== 分割长文本 ==========
  function splitText(text, maxLen) {
    maxLen = maxLen || 200;
    const sentences = text.match(/[^。！？\n.!?]+[。！？\n.!?]+/g) || [text];
    const chunks = [];
    let current = '';
    for (const s of sentences) {
      if ((current + s).length > maxLen && current) {
        chunks.push(current);
        current = s;
      } else {
        current += s;
      }
    }
    if (current) chunks.push(current);
    return chunks.length ? chunks : [text];
  }

  // ========== 语音播放器 ==========
  function createPlayer() {
    const synth = window.speechSynthesis;
    if (!synth) return null;

    let chunks = [];
    let currentIdx = 0;
    let isPlaying = false;
    let rate = 1.0;

    // ---- UI ----
    const container = document.createElement('div');
    container.className = 'tts-player';
    container.innerHTML = `
      <style>
        .tts-player { position:fixed; bottom:28px; right:28px; z-index:9999; font-family:system-ui,-apple-system,sans-serif }
        .tts-btn {
          width:52px;height:52px;border-radius:50%;border:none;
          background:linear-gradient(135deg,#3b82f6,#8b5cf6);
          color:#fff;font-size:22px;cursor:pointer;
          box-shadow:0 4px 16px rgba(59,130,246,.35);
          display:flex;align-items:center;justify-content:center;
          transition:transform .2s,box-shadow .2s
        }
        .tts-btn:hover { transform:scale(1.08);box-shadow:0 6px 22px rgba(59,130,246,.5) }
        .tts-btn:active { transform:scale(.95) }
        .tts-bar {
          display:none;position:absolute;bottom:62px;right:0;
          background:var(--surface-1,#fff);border-radius:14px;
          padding:14px 18px;min-width:200px;
          box-shadow:0 8px 32px rgba(0,0,0,.12);
          border:1px solid var(--border-2,rgba(128,128,128,.12));
          flex-direction:column;gap:10px
        }
        .tts-bar.show { display:flex }
        .tts-bar-row { display:flex;align-items:center;gap:10px }
        .tts-bar-label { font-size:12px;color:var(--text-3,#888);white-space:nowrap }
        .tts-bar-title { font-size:13px;color:var(--text-1,#222);font-weight:600;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px }
        .tts-bar-btn {
          width:34px;height:34px;border-radius:50%;border:none;
          background:var(--surface-2,rgba(128,128,128,.06));
          cursor:pointer;font-size:16px;display:flex;
          align-items:center;justify-content:center;flex-shrink:0
        }
        .tts-bar-btn:hover { background:var(--accent,#3b82f6);color:#fff }
        .tts-bar-btn.play-btn { width:40px;height:40px;font-size:18px }
        .tts-speed { font-size:11px;padding:4px 10px;border-radius:8px;
          border:1px solid var(--border-2,rgba(128,128,128,.15));
          background:transparent;cursor:pointer;color:var(--text-2,#555) }
        .tts-speed.active { background:var(--accent,#3b82f6);color:#fff;border-color:var(--accent,#3b82f6) }
        .tts-progress { height:3px;background:var(--surface-2,rgba(128,128,128,.08));border-radius:2px;overflow:hidden }
        .tts-progress-bar { height:100%;background:var(--accent,#3b82f6);border-radius:2px;transition:width .2s }
        @media(max-width:768px) {
          .tts-player { bottom:16px;right:16px }
          .tts-btn { width:46px;height:46px;font-size:20px }
          .tts-bar { right:-4px;min-width:180px;padding:12px 14px }
        }
      </style>
      <div class="tts-btn" id="tts-main-btn" title="听书">🔊</div>
      <div class="tts-bar" id="tts-bar">
        <div class="tts-bar-title" id="tts-title">听书</div>
        <div class="tts-bar-row">
          <button class="tts-bar-btn play-btn" id="tts-play">▶</button>
          <button class="tts-bar-btn" id="tts-stop">⏹</button>
          <span style="flex:1"></span>
          <button class="tts-speed" data-rate="0.75">0.75x</button>
          <button class="tts-speed active" data-rate="1.0">1x</button>
          <button class="tts-speed" data-rate="1.25">1.25x</button>
        </div>
        <div class="tts-progress"><div class="tts-progress-bar" id="tts-progress" style="width:0%"></div></div>
      </div>
    `;

    const mainBtn = container.querySelector('#tts-main-btn');
    const bar = container.querySelector('#tts-bar');
    const playBtn = container.querySelector('#tts-play');
    const stopBtn = container.querySelector('#tts-stop');
    const progressBar = container.querySelector('#tts-progress');
    const speedBtns = container.querySelectorAll('.tts-speed');

    let barVisible = false;

    function updateProgress() {
      if (!chunks.length) return;
      const pct = Math.round((currentIdx / chunks.length) * 100);
      progressBar.style.width = pct + '%';
    }

    function stopReading() {
      synth.cancel();
      isPlaying = false;
      playBtn.textContent = '▶';
    }

    function speakNext() {
      if (currentIdx >= chunks.length) {
        stopReading();
        currentIdx = 0;
        updateProgress();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[currentIdx]);
      utterance.lang = 'zh-CN';
      utterance.rate = rate;
      utterance.onend = function() {
        currentIdx++;
        updateProgress();
        speakNext();
      };
      utterance.onerror = function() {
        currentIdx++;
        updateProgress();
        speakNext();
      };
      synth.speak(utterance);
    }

    function startReading() {
      if (isPlaying) {
        // Pause
        synth.cancel();
        isPlaying = false;
        playBtn.textContent = '▶';
        return;
      }
      if (currentIdx >= chunks.length) {
        // Restart
        currentIdx = 0;
        const text = getArticleText();
        if (!text) { alert('未找到文章内容'); return; }
        chunks = splitText(text, 200);
      }
      isPlaying = true;
      playBtn.textContent = '⏸';
      updateProgress();
      speakNext();
    }

    // ---- Events ----
    mainBtn.addEventListener('click', function() {
      if (!barVisible) {
        const text = getArticleText();
        if (!text) { alert('未找到文章内容'); return; }
        chunks = splitText(text, 200);
        currentIdx = 0;
        updateProgress();
        bar.classList.add('show');
        barVisible = true;
      }
      startReading();
      mainBtn.textContent = isPlaying ? '⏸' : '🔊';
    });

    playBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!chunks.length) {
        const text = getArticleText();
        if (!text) return;
        chunks = splitText(text, 200);
      }
      startReading();
      mainBtn.textContent = isPlaying ? '⏸' : '🔊';
    });

    stopBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      stopReading();
      currentIdx = 0;
      updateProgress();
      mainBtn.textContent = '🔊';
      bar.classList.remove('show');
      barVisible = false;
    });

    speedBtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        rate = parseFloat(btn.dataset.rate);
      });
    });

    // Click outside to hide bar
    document.addEventListener('click', function(e) {
      if (barVisible && !container.contains(e.target)) {
        bar.classList.remove('show');
        barVisible = false;
      }
    });

    return container;
  }

  // ========== Init ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Only on article pages
    const article = document.querySelector('article');
    if (!article) return;
    const text = getArticleText();
    if (text.length < 50) return; // too short, skip

    const player = createPlayer();
    if (player) {
      document.body.appendChild(player);
    }
  }
})();
