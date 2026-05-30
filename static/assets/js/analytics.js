(function(){'use strict';
var B='/api/analytics',D={url:window.location.pathname+window.location.search,referrer:document.referrer||'',screen_w:window.screen.width,screen_h:window.screen.height,scroll_depth:0};
function s(e,d){try{navigator.sendBeacon(B+e,JSON.stringify(Object.assign({},D,d)))}catch(e){}}
if(navigator.sendBeacon)s('/pageview',{});
var t=Date.now();
function r(){var d=Math.round((Date.now()-t)/1000);d>2&&s('/pageview',{duration:d})}
window.addEventListener('beforeunload',r);
document.addEventListener('visibilitychange',function(){document.visibilityState==='hidden'&&r()});
var R={},T=[25,50,75,100];
function c(){var st=window.scrollY||window.pageYOffset,dh=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight),wh=window.innerHeight;if(dh<=wh){if(!R[100]){R[100]=true;D.scroll_depth=100;s('/pageview',{scroll_depth:100})}return}var sc=Math.round((st+wh)/dh*100);T.forEach(function(t){if(sc>=t&&!R[t]){R[t]=true;D.scroll_depth=t;s('/pageview',{scroll_depth:t})}})}
var st;window.addEventListener('scroll',function(){clearTimeout(st);st=setTimeout(c,300)},{passive:true});
setTimeout(c,1000);
document.addEventListener('click',function(e){var t=e.target;while(t&&t.tagName!=='A')t=t.parentElement;if(!t)return;var h=t.getAttribute('href')||'';if(!h||h.startsWith('#'))return;s('/pageview',{click_target:h})},true);
})();
