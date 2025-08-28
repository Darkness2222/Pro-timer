// Minimal test version - just to see if Pro Timer tab works
(()=>{
const $=s=>document.querySelector(s);
const LS={theme:‘synccue.theme’};
const screens=[‘mainTimer’,‘pomodoro’,‘stopwatch’,‘proTimer’];
let si=0;

function show(i){
si=(i+screens.length)%screens.length;
screens.forEach((id,idx)=>{
const el = $(’#’+id);
if(el) el.classList.toggle(‘active’, idx===si);
});
syncTabs();

if(screens[si] === ‘proTimer’) {
showProTimer();
}
}

function syncTabs(){
document.querySelectorAll(’.tab’).forEach(b=>{
const a=b.dataset.tab===screens[si];
b.classList.toggle(‘active’,a);
b.setAttribute(‘aria-selected’,a?‘true’:‘false’);
});
}

// Tab click handlers
document.querySelectorAll(’.tab’).forEach(btn=>btn.addEventListener(‘click’,()=>{
const id=btn.dataset.tab;
const idx=screens.indexOf(id);
if(idx>=0) show(idx);
}));

// Theme toggle
function applyTheme(v){
document.body.classList.toggle(‘dark’, v===‘dark’);
localStorage.setItem(LS.theme,v);
const toggle = $(’#themeToggle’);
if(toggle) toggle.textContent = v===‘dark’ ? ‘☀️’ : ‘🌙’;
}

const themeToggle = $(’#themeToggle’);
if(themeToggle) {
themeToggle.addEventListener(‘click’, ()=>
applyTheme(document.body.classList.contains(‘dark’)?‘light’:‘dark’)
);
}

// Pro Timer simple test
function showProTimer() {
const container = $(’#proTimer’);
if(!container) return;

container.innerHTML = `
<div style="padding: 3rem; text-align: center; background: var(--bg-primary); min-height: 60vh;">
<h2 style="font-size: 2.5rem; color: var(--text-primary); margin-bottom: 2rem;">🎯 Pro Timer</h2>
<p style="font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 3rem;">This is working! Pro Timer tab is clickable.</p>

```
  <div style="background: var(--bg-card); padding: 3rem; border-radius: 12px; border: 1px solid var(--border-color); max-width: 600px; margin: 0 auto;">
    <div style="font-size: 4rem; font-family: 'Courier New', monospace; color: #e53935; margin-bottom: 2rem;">05:00</div>
    <div style="background: #4b5563; height: 12px; border-radius: 6px; margin-bottom: 2rem;">
      <div style="background: linear-gradient(to right, #10b981, #f59e0b, #ef4444); height: 100%; width: 100%; border-radius: 6px;"></div>
    </div>
    <button onclick="alert('Pro Timer button works!')" style="background: #3b82f6; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; font-size: 1.1rem; cursor: pointer;">
      Test Button - Click Me!
    </button>
  </div>
  
  <p style="color: var(--text-muted); margin-top: 2rem; font-size: 0.875rem;">
    If you can see this and click the button, the basic structure is working!
  </p>
</div>
```

`;
}

// Initialize
applyTheme(localStorage.getItem(LS.theme)||‘dark’);
show(0);

})();
