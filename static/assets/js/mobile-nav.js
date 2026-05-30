/* Mobile nav toggle */
(function() {
  'use strict';
  if (window.innerWidth > 768) return;
  var nav = document.querySelector('.site-nav');
  if (!nav) return;
  var links = nav.querySelector('.site-nav-links');
  if (!links) return;
  links.style.display = 'none';
  var btn = document.createElement('button');
  btn.className = 'mobile-nav-toggle';
  btn.innerHTML = '☰';
  btn.setAttribute('aria-label', 'Toggle navigation');
  Object.assign(btn.style, {
    background: 'none', border: 'none', fontSize: '1.4em',
    cursor: 'pointer', color: 'var(--text-1)', padding: '4px 8px'
  });
  btn.addEventListener('click', function() {
    links.style.display = links.style.display === 'none' ? 'flex' : 'none';
  });
  var logo = nav.querySelector('.site-nav-logo');
  if (logo) logo.after(btn);
})();
