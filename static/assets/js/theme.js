/**
 * AI Know Theme v1 · Auto switch + manual toggle
 */
(function() {
  'use strict';
  var KEY = 'ai-know-theme';
  function get() { try { return localStorage.getItem(KEY); } catch(e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch(e) {} }
  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    var btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.textContent = t === 'dark' ? '☀️' : '🌙';
    }
  }
  function init() {
    var s = get();
    if (s === 'light' || s === 'dark') apply(s);
    var nav = document.querySelector('nav');
    if (nav) {
      var btn = document.createElement('button');
      btn.id = 'themeToggleBtn';
      btn.className = 'theme-toggle';
      btn.textContent = s === 'light' ? '🌙' : '☀️';
      btn.style.cssText = 'margin-left:auto;flex-shrink:0';
      btn.addEventListener('click', function() {
        var cur = document.documentElement.getAttribute('data-theme');
        if (cur === 'light' || (!cur && window.matchMedia('(prefers-color-scheme: light)').matches)) {
          apply('dark'); set('dark');
        } else {
          apply('light'); set('light');
        }
      });
      nav.appendChild(btn);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
