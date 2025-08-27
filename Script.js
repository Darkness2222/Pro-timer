(()=>{
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const pad=n=>String(n).padStart(2,‘0’);
const LS={
theme:‘synccue.theme’,
mH:‘synccue.main.hours’,
mHs:‘synccue.main.hundredths’,
mC:‘synccue.main.color’,
pH:‘synccue.pomo.hours’,
pHs:‘synccue.pomo.hundredths’,
pC:‘synccue.pomo.color’,
sH:‘synccue.sw.hours’,
sHs:‘synccue.sw.hundredths’,
sC:‘synccue.sw.color’,
proTimers:‘synccue.pro.timers’,
proMessages:‘synccue.pro.messages’
};

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
initProTimer();
}
}

function syncTabs(){
$$(’.tab’).forEach(b=>{
const a=b.dataset.tab===screens[si];
b.classList.toggle(‘active’,a);
b.setAttribute(‘aria-selected’,a?‘true’:‘false’);
});
}

$$(’.tab’).forEach(btn=>btn.addEventListener(‘click’,()=>{
const id=btn.dataset.tab;
const idx=screens.indexOf(id);
if(idx>=0) show(idx);
}));

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

applyTheme(localStorage.getItem(LS.theme)||‘dark’);
syncTabs();

function exportListToCSV(el, filename, header=‘timestamp,event’){
if(!el) return;
const rows=[header];
el.querySelectorAll(‘li’).forEach(li=>{
const t=li.textContent.split(’ — ‘);
if(t.length>=2) rows.push(`"${t[0].replace(/"/g,'""')}","${t.slice(1).join(' — ').replace(/"/g,'""')}"`);
else rows.push(`,"${li.textContent.replace(/"/g,'""')}"`);
});
const blob=new Blob([rows.join(’\n’)],{type:‘text/csv;charset=utf-8;’});
const a=document.createElement(‘a’);
a.href=URL.createObjectURL(blob);
a.download=filename;
a.click();
setTimeout(()=>URL.revokeObjectURL(a.href),500);
}

function fmtTime(ms, showH, showHund){
const hundredths = Math.floor((ms%1000)/10);
let totalSec = Math.floor(ms/1000);
const s = totalSec % 60;
totalSec = Math.floor(totalSec/60);
const m = totalSec % 60;
const h = Math.floor(totalSec/60);
const base = (showH || h>0) ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
return showHund ? `${base}.${pad(hundredths)}` : base;
}

/* ––––– Fullscreen overlay ––––– */
const fs=$(’#fs’), fsDigits=$(’#fsDigits’), fsBar=$(’#fsBar’), fsElapsed=$(’#fsElapsed’), fsBarWrap=$(’#fsBarWrap’), fsStatus=$(’#fsStatus’);
let fsMode=null;

function setFsFont(text){
if(!fsDigits) return;
const len=text.length;
let size=‘20vw’;
if(len>=12) size=‘12vw’;
else if(len>=10) size=‘15vw’;
else if(len>=9) size=‘18vw’;
fsDigits.style.fontSize=size;
}

function openFS(mode, text, ratio, paused, color, showBar){
if(!fs || !fsDigits) return;
fsMode=mode;
fsDigits.textContent=text;
fsDigits.style.color=color||’’;
setFsFont(text);
if(fsBarWrap) fsBarWrap.style.display=showBar?‘block’:‘none’;
const r=Math.max(0,Math.min(1,ratio||0));
if(fsBar) fsBar.style.transform=`scaleX(${r})`;
if(fsElapsed) fsElapsed.style.width=`${(1-r)*100}%`;
if(fsStatus) fsStatus.style.display = paused?‘block’:‘none’;
fs.classList.remove(‘hidden’);
}

function closeFS(){
fsMode=null;
if(fs) fs.classList.add(‘hidden’);
}

const fsExit = $(’#fsExit’);
if(fsExit) fsExit.addEventListener(‘click’, closeFS);

window.addEventListener(‘resize’,()=>{
if(!fsMode || !fsDigits) return;
setFsFont(fsDigits.textContent);
});

/* ––––– Main Timer ––––– */
let mainDur=300000, mainRemain=300000, mainRunning=false, mainTick=null, mainStep=1000;
const mainDigits=$(’#mainTime’), mainBar=$(’#mainBar’), mainElapsed=$(’#mainElapsed’), mainLog=$(’#mainLog’);
const optHours=$(’#optHours’), optHund=$(’#optHundredths’), digitColor=$(’#digitColor’);
const mtModal=$(’#mtSettings’);

const mainSettings = $(’#mainSettings’);
if(mainSettings) mainSettings.addEventListener(‘click’, ()=>mtModal?.classList.remove(‘hidden’));
const mtClose = $(’#mtClose’);
if(mtClose) mtClose.addEventListener(‘click’, ()=>mtModal?.classList.add(‘hidden’));
const mtCancel = $(’#mtCancel’);
if(mtCancel) mtCancel.addEventListener(‘click’, ()=>mtModal?.classList.add(‘hidden’));
const mainToggleLog = $(’#mainToggleLog’);
if(mainToggleLog) mainToggleLog.addEventListener(‘click’, ()=>$(’#mainLogCard’)?.classList.toggle(‘hidden’));

if(optHours) optHours.checked=(localStorage.getItem(LS.mH)||‘false’)===‘true’;
if(optHund) optHund.checked =(localStorage.getItem(LS.mHs)||‘false’)===‘true’;
if(digitColor) {
digitColor.value = localStorage.getItem(LS.mC) || ‘#e53935’;
if(mainDigits) mainDigits.style.color = digitColor.value;
}

if(optHours) optHours.onchange=()=>{ localStorage.setItem(LS.mH,optHours.checked?‘true’:‘false’); drawMain(); };
if(optHund) optHund.onchange =()=>{ localStorage.setItem(LS.mHs,optHund.checked?‘true’:‘false’); setMainCadence(); drawMain(); };
if(digitColor) digitColor.oninput=e=>{ localStorage.setItem(LS.mC,e.target.value); if(mainDigits) mainDigits.style.color=e.target.value; if(fsMode===‘main’ && fsDigits) fsDigits.style.color=e.target.value; };

const mainInput=$(’#mainInput’);

function fmtMain(){ return fmtTime(mainRemain, optHours?.checked, optHund?.checked); }
function setMainCadence(){ const step=optHund?.checked?10:1000; if(step!==mainStep){ mainStep=step; if(mainRunning){ clearInterval(mainTick); mainTick=setInterval(tickMain, mainStep); } } }
function drawMain(){
if(!mainDigits) return;
mainDigits.textContent=fmtMain();
const r=(mainDur?mainRemain/mainDur:0);
const rr=Math.max(0,Math.min(1,r));
if(mainBar) mainBar.style.transform=`scaleX(${rr})`;
if(mainElapsed) mainElapsed.style.width=`${(1-rr)*100}%`;
updateFS(‘main’, r, !mainRunning && mainRemain>0 && mainRemain<mainDur, mainDigits.textContent, digitColor?.value, true);
}
function tickMain(){ mainRemain=Math.max(0,mainRemain-mainStep); drawMain(); if(mainRemain<=0){ mainPause(); log(mainLog,‘Finished’); } }
function mainStart(){ if(mainRunning) return; if(mainRemain<=0){ if(mainDur<=0) return; mainRemain=mainDur; } setMainCadence(); mainRunning=true; mainTick=setInterval(tickMain, mainStep); log(mainLog,`Started (${fmtMain()})`); }
function mainPause(){ if(!mainRunning) return; mainRunning=false; clearInterval(mainTick); drawMain(); log(mainLog,`Paused at ${fmtMain()}`); }
function mainStop(){ mainRunning=false; clearInterval(mainTick); mainRemain=0; drawMain(); log(mainLog,‘Stopped’); }
function mainReset(){ mainRunning=false; clearInterval(mainTick); mainRemain=mainDur; drawMain(); log(mainLog,‘Reset’); }

function setMainFromInput(){
if(!mainInput) return;
const v=mainInput.value.trim();
const mm=/^(\d+):(\d{2})$/.exec(v);
if(!mm){ alert(‘Use mm:ss format’); return; }
const m=+mm[1], s=+mm[2];
mainDur=(m*60+s)*1000;
mainRemain=mainDur;
drawMain();
log(mainLog,`Set to ${fmtMain()}`);
}

function log(el,text){
if(!el) return;
const li=document.createElement(‘li’);
li.textContent=new Date().toLocaleTimeString()+’ — ’+text;
el.prepend(li);
}

// Main Timer Event Listeners
const mainStart_btn = $(’#mainStart’);
if(mainStart_btn) mainStart_btn.addEventListener(‘click’, mainStart);
const mainPause_btn = $(’#mainPause’);
if(mainPause_btn) mainPause_btn.addEventListener(‘click’, mainPause);
const mainStop_btn = $(’#mainStop’);
if(mainStop_btn) mainStop_btn.addEventListener(‘click’, mainStop);
const mainReset_btn = $(’#mainReset’);
if(mainReset_btn) mainReset_btn.addEventListener(‘click’, mainReset);
const mainSet_btn = $(’#mainSet’);
if(mainSet_btn) mainSet_btn.addEventListener(‘click’, setMainFromInput);
const mainClearLog_btn = $(’#mainClearLog’);
if(mainClearLog_btn) mainClearLog_btn.addEventListener(‘click’, ()=>mainLog && (mainLog.innerHTML=’’));
const mainExportCSV_btn = $(’#mainExportCSV’);
if(mainExportCSV_btn) mainExportCSV_btn.addEventListener(‘click’, ()=>exportListToCSV(mainLog,‘main_timer_log.csv’));
const mtExport_btn = $(’#mtExport’);
if(mtExport_btn) mtExport_btn.addEventListener(‘click’, ()=>exportListToCSV(mainLog,‘main_timer_log.csv’));

$$(’[data-preset]’).forEach(b=>b.addEventListener(‘click’, ()=>{
const s=parseInt(b.dataset.preset,10);
mainDur=s*1000;
mainRemain=mainDur;
drawMain();
log(mainLog,`Preset ${b.textContent}`);
}));

$$(’[data-adjust]’).forEach(b=>b.addEventListener(‘click’, ()=>{
const d=parseInt(b.dataset.adjust,10)*1000;
mainRemain=Math.max(0,mainRemain+d);
if(mainRemain>mainDur) mainDur=mainRemain;
drawMain();
log(mainLog,`Adjust ${b.textContent} → ${fmtMain()}`);
}));

const mainFullscreen_btn = $(’#mainFullscreen’);
if(mainFullscreen_btn) {
mainFullscreen_btn.addEventListener(‘click’, ()=>
openFS(‘main’, mainDigits?.textContent||‘00:00’, (mainDur?mainRemain/mainDur:0), !mainRunning && mainRemain>0 && mainRemain<mainDur, digitColor?.value, true)
);
}

/* ––––– Pro Timer ––––– */
let proTimers = [], activeProTimer = null, proCurrentTime = 0, proIsRunning = false, proMessages = [], proTick = null;
let proView = ‘admin’, showQR = false;

function loadProTimers() {
try {
const saved = localStorage.getItem(LS.proTimers);
proTimers = saved ? JSON.parse(saved) : [];
} catch(e) {
proTimers = [];
}
}

function saveProTimers() {
localStorage.setItem(LS.proTimers, JSON.stringify(proTimers));
}

function loadProMessages() {
try {
const saved = localStorage.getItem(LS.proMessages);
proMessages = saved ? JSON.parse(saved) : [];
} catch(e) {
proMessages = [];
}
}

function saveProMessages() {
localStorage.setItem(LS.proMessages, JSON.stringify(proMessages));
}

function initProTimer() {
loadProTimers();
loadProMessages();

const urlParams = new URLSearchParams(window.location.search);
if(urlParams.get(‘view’) === ‘presenter’) {
const timerId = urlParams.get(‘timer’);
if(timerId && timerId !== ‘demo’) {
const timer = proTimers.find(t => t.id === timerId);
if(timer) {
activeProTimer = timer;
proCurrentTime = timer.duration;
loadProMessages();
}
}
proView = ‘presenter’;
}

renderProTimer();
}

function createProTimer() {
const nameInput = $(’#proTimerName’);
const presenterInput = $(’#proPresenterName’);
const durationInput = $(’#proDuration’);

if(!nameInput || !presenterInput || !durationInput) return;

const name = nameInput.value.trim();
const presenter = presenterInput.value.trim();
const duration = parseInt(durationInput.value) || 5;

if(!name || !presenter || duration <= 0) {
alert(‘Please fill in all fields with valid values’);
return;
}

const newTimer = {
id: Date.now().toString(),
name: name,
presenter: presenter,
duration: duration * 60,
created: new Date().toLocaleString()
};

proTimers.push(newTimer);
saveProTimers();

nameInput.value = ‘’;
presenterInput.value = ‘’;
durationInput.value = ‘5’;

proView = ‘admin’;
renderProTimer();
}

function startProTimer(timer) {
activeProTimer = timer;
proCurrentTime = timer.duration;
proIsRunning = false;
proMessages = [];
saveProMessages();
renderProTimer();
}

function toggleProTimer() {
if(!activeProTimer) return;

proIsRunning = !proIsRunning;

if(proIsRunning) {
proTick = setInterval(() => {
proCurrentTime = Math.max(0, proCurrentTime - 1);
renderProTimer();

```
  if(proCurrentTime <= 0) {
    proIsRunning = false;
    clearInterval(proTick);
    renderProTimer();
  }
}, 1000);
```

} else {
clearInterval(proTick);
}

renderProTimer();
}

function stopProTimer() {
proIsRunning = false;
clearInterval(proTick);
proCurrentTime = 0;
renderProTimer();
}

function resetProTimer() {
proIsRunning = false;
clearInterval(proTick);
if(activeProTimer) {
proCurrentTime = activeProTimer.duration;
}
renderProTimer();
}

function sendProMessage() {
const input = $(’#proMessageInput’);
if(!input || !activeProTimer) return;

const text = input.value.trim();
if(!text) return;

const message = {
id: Date.now(),
text: text,
timestamp: new Date().toLocaleTimeString()
};

proMessages.push(message);
saveProMessages();
input.value = ‘’;
renderProTimer();
}

function sendQuickMessage(text) {
if(!activeProTimer) return;

const message = {
id: Date.now(),
text: text,
timestamp: new Date().toLocaleTimeString()
};

proMessages.push(message);
saveProMessages();
renderProTimer();
}

function formatProTime(seconds) {
const mins = Math.floor(seconds / 60);
const secs = seconds % 60;
return `${pad(mins)}:${pad(secs)}`;
}

function getPresenterUrl() {
const baseUrl = window.location.origin + window.location.pathname;
return `${baseUrl}?view=presenter&timer=${activeProTimer?.id || 'demo'}`;
}

function copyPresenterUrl() {
const url = getPresenterUrl();
navigator.clipboard.writeText(url).then(() => {
const btn = $(’#proCopyUrl’);
if(btn) {
const originalText = btn.textContent;
btn.textContent = ‘Copied!’;
btn.style.backgroundColor = ‘#059669’;
setTimeout(() => {
btn.textContent = originalText;
btn.style.backgroundColor = ‘’;
}, 2000);
}
}).catch(() => {
alert(’Copied to clipboard: ’ + url);
});
}

function toggleQRCode() {
showQR = !showQR;
renderProTimer();
}

function generateQRCode(text) {
return `data:image/svg+xml;base64,${btoa(`
<svg width="160" height="160" xmlns="http://www.w3.org/2000/svg">
<rect width="160" height="160" fill="white" stroke="#e5e7eb" stroke-width="2" rx="8"/>
<rect x="20" y="20" width="20" height="20" fill="#000"/>
<rect x="120" y="20" width="20" height="20" fill="#000"/>
<rect x="20" y="120" width="20" height="20" fill="#000"/>
<rect x="60" y="60" width="40" height="40" fill="#000"/>
<text x="80" y="100" text-anchor="middle" font-size="8" fill="#666">QR Code</text>
<text x="80" y="115" text-anchor="middle" font-size="6" fill="#999">Pro Timer</text>
</svg>
`)}`;
}

function renderProTimer() {
const container = $(’#proTimer’);
if(!container) return;

if(proView === ‘presenter’) {
renderPresenterView(container);
} else if(proView === ‘create’) {
renderCreateView(container);
} else {
renderAdminView(container);
}
}

function renderPresenterView(container) {
const progress = activeProTimer ? ((activeProTimer.duration - proCurrentTime) / activeProTimer.duration) * 100 : 0;

container.innerHTML = `
<div style="min-height: 100vh; background: var(--bg-primary); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; position: relative;">
<button onclick="proView='admin'; renderProTimer();" style="position: fixed; top: 1rem; left: 1rem; background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-color); padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.875rem; z-index: 100;">
← Back to Admin
</button>

```
  <div style="margin-bottom: 3rem;">
    <div style="font-size: clamp(4rem, 12vw, 8rem); font-weight: bold; color: #e53935; font-family: 'Courier New', monospace; margin-bottom: 2rem; text-shadow: 0 0 20px rgba(229, 57, 53, 0.3); line-height: 1;">
      ${formatProTime(proCurrentTime)}
    </div>
    
    <div style="width: 100%; max-width: 800px; height: 16px; background: var(--bg-secondary); border-radius: 8px; overflow: hidden; margin: 2rem auto; box-shadow: inset 0 2px 4px var(--shadow);">
      <div style="height: 100%; background: linear-gradient(to right, #10b981 0%, #f59e0b 70%, #ef4444 100%); transition: width 1s ease-linear; border-radius: 8px; width: ${progress}%;"></div>
    </div>

    ${activeProTimer ? `<div style="font-size: 1.5rem; color: var(--text-secondary); margin-top: 1rem; font-weight: 500;">Presenter: ${activeProTimer.presenter}</div>` : ''}
  </div>
  
  ${proMessages.length > 0 ? `
    <div style="background: var(--bg-card); border-radius: 12px; padding: 2rem; max-width: 700px; width: 100%; margin-top: 2rem; box-shadow: 0 4px 6px var(--shadow); border: 1px solid var(--border-color);">
      <h3 style="color: #60a5fa; margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 600;">Messages from Control</h3>
      <div style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem;">
        ${proMessages.slice(-5).reverse().map(msg => `
          <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1rem; text-align: left; border-left: 4px solid #60a5fa;">
            <div style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 1.1rem;">${msg.text}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${msg.timestamp}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}
</div>
```

`;
}

function renderCreateView(container) {
container.innerHTML = `
<div style="padding: 2rem; max-width: 600px; margin: 0 auto;">
<button onclick="proView='admin'; renderProTimer();" style="color: #60a5fa; background: none; border: none; margin-bottom: 2rem; cursor: pointer; font-size: 0.875rem;">
← Back to Dashboard
</button>

```
  <h2 style="font-size: 2rem; font-weight: bold; color: var(--text-primary); margin-bottom: 2rem; text-align: center;">Create New Timer</h2>
  
  <div style="background: var(--bg-card); padding: 2rem; border-radius: 12px; border: 1px solid var(--border-color);">
    <div style="margin-bottom: 1.5rem;">
      <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Timer Name</label>
      <input type="text" id="proTimerName" placeholder="e.g., Morning Presentation" style="width: 100%; padding: 0.875rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 1rem;">
    </div>
    
    <div style="margin-bottom: 1.5rem;">
      <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Presenter Name</label>
      <input type="text" id="proPresenterName" placeholder="e.g., Bob" style="width: 100%; padding: 0.875rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 1rem;">
    </div>
    
    <div style="margin-bottom: 1.5rem;">
      <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Duration (minutes)</label>
      <input type="number" id="proDuration" value="5" min="1" style="width: 100%; padding: 0.875rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 1rem;">
    </div>
    
    <button onclick="createProTimer()" style="width: 100%; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 1rem 1.5rem; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 1rem; transition: all 0.2s ease;">
      Create Timer
    </button>
  </div>
</div>
```

`;
}

function renderAdminView(container) {
const progress = activeProTimer ? ((activeProTimer.duration - proCurrentTime) / activeProTimer.duration) * 100 : 0;

container.innerHTML = `
<div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); flex-wrap: wrap; gap: 1rem;">
<h2 style="font-size: 2rem; font-weight: bold; color: var(--text-primary); margin: 0;">Pro Timer Dashboard</h2>
<button onclick="proView='create'; renderProTimer();" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;">
+ Create Timer
</button>
</div>

```
  <div style="display: grid; grid-template-columns: 1fr; gap: 2rem;">
    ${proTimers.length === 0 ? `
      <div style="text-align: center; padding: 4rem 2rem; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color);">
        <h3 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--text-primary);">Welcome to Pro Timer</h3>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">Create professional presentation timers with admin control and presenter displays.</p>
        <button onclick="proView='create'; renderProTimer();" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 1rem 2rem; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 1.1rem;">
          Create Your First Timer
        </button>
      </div>
    ` : `
      <div style="background: var(--bg-card); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border-color); box-shadow: 0 2px 4px var(--shadow);">
        <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600;">🎯 Your Timers</h3>
        <div style="display: grid; gap: 0.75rem; margin-bottom: 2rem;">
          ${proTimers.map(timer => `
            <div onclick="startProTimer(${JSON.stringify(timer).replace(/"/g, '&quot;')})" style="padding: 1.25rem; background: ${activeProTimer?.id === timer.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)'}; border: 2px solid ${activeProTimer?.id === timer.id ? '#3b82f6' : 'var(--border-color)'}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; position: relative;">
              <h4 style="color: var(--text-primary); margin: 0 0 0.25rem 0;
```
