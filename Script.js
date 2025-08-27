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
let mainDur=0, mainRemain=0, mainRunning=false, mainTick=null, mainStep=1000;
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
if(digitColor) digitColor.oninput=e=>{ localStorage.setItem(LS.mC,e.target.value); if(mainDigits) mainDigits.style.color=e.target.value; if(fsMode===‘main’) fsDigits.style.color=e.target.value; };

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

$$(’#mainTimer [data-preset]’).forEach(b=>b.onclick=()=>{
const s=parseInt(b.dataset.preset,10);
mainDur=s*1000;
mainRemain=mainDur;
drawMain();
log(mainLog,`Preset ${b.textContent}`);
});

$$(’#mainTimer [data-adjust]’).forEach(b=>b.onclick=()=>{
const d=parseInt(b.dataset.adjust,10)*1000;
mainRemain=Math.max(0,mainRemain+d);
if(mainRemain>mainDur) mainDur=mainRemain;
drawMain();
log(mainLog,`Adjust ${b.textContent} → ${fmtMain()}`);
});

const mainFullscreen_btn = $(’#mainFullscreen’);
if(mainFullscreen_btn) {
mainFullscreen_btn.addEventListener(‘click’, ()=>
openFS(‘main’, mainDigits?.textContent||‘00:00’, (mainDur?mainRemain/mainDur:0), !mainRunning && mainRemain>0 && mainRemain<mainDur, digitColor?.value, true)
);
}

/* ––––– Pomodoro ––––– */
let pomoDur=1500*1000, pomoRemain=pomoDur, pomoRunning=false, pomoTick=null, pomoStep=1000;
const pomoDigits=$(’#pomoTime’), pomoBar=$(’#pomoBar’), pomoElapsed=$(’#pomoElapsed’), pomoLog=$(’#pomoLog’);
const pomoHours=$(’#pomoHours’), pomoHund=$(’#pomoHundredths’), pomoColor=$(’#pomoColor’);
const pmModal=$(’#pmSettings’);

const pomoSettings_btn = $(’#pomoSettings’);
if(pomoSettings_btn) pomoSettings_btn.addEventListener(‘click’, ()=>pmModal?.classList.remove(‘hidden’));
const pmClose_btn = $(’#pmClose’);
if(pmClose_btn) pmClose_btn.addEventListener(‘click’, ()=>pmModal?.classList.add(‘hidden’));
const pmCancel_btn = $(’#pmCancel’);
if(pmCancel_btn) pmCancel_btn.addEventListener(‘click’, ()=>pmModal?.classList.add(‘hidden’));
const pomoToggleLog_btn = $(’#pomoToggleLog’);
if(pomoToggleLog_btn) pomoToggleLog_btn.addEventListener(‘click’, ()=>$(’#pomoLogCard’)?.classList.toggle(‘hidden’));

if(pomoHours) pomoHours.checked=(localStorage.getItem(LS.pH)||‘false’)===‘true’;
if(pomoHund) pomoHund.checked =(localStorage.getItem(LS.pHs)||‘false’)===‘true’;
if(pomoColor) {
pomoColor.value = localStorage.getItem(LS.pC) || ‘#e53935’;
if(pomoDigits) pomoDigits.style.color = pomoColor.value;
}

if(pomoHours) pomoHours.onchange=()=>{ localStorage.setItem(LS.pH,pomoHours.checked?‘true’:‘false’); drawPomo(); };
if(pomoHund) pomoHund.onchange =()=>{ localStorage.setItem(LS.pHs,pomoHund.checked?‘true’:‘false’); setPomoCadence(); drawPomo(); };
if(pomoColor) pomoColor.oninput=e=>{ localStorage.setItem(LS.pC,e.target.value); if(pomoDigits) pomoDigits.style.color=e.target.value; if(fsMode===‘pomo’) fsDigits.style.color=e.target.value; };

function fmtPomo(){ return fmtTime(pomoRemain, pomoHours?.checked, pomoHund?.checked); }
function setPomoCadence(){ const step=pomoHund?.checked?10:1000; if(step!==pomoStep){ pomoStep=step; if(pomoRunning){ clearInterval(pomoTick); pomoTick=setInterval(tickPomo, pomoStep); } } }
function drawPomo(){
if(!pomoDigits) return;
pomoDigits.textContent=fmtPomo();
const r=(pomoDur?pomoRemain/pomoDur:0);
const rr=Math.max(0,Math.min(1,r));
if(pomoBar) pomoBar.style.transform=`scaleX(${rr})`;
if(pomoElapsed) pomoElapsed.style.width=`${(1-rr)*100}%`;
updateFS(‘pomo’, r, !pomoRunning && pomoRemain>0 && pomoRemain<pomoDur, pomoDigits.textContent, pomoColor?.value, true);
}
function tickPomo(){ pomoRemain=Math.max(0,pomoRemain-pomoStep); drawPomo(); if(pomoRemain<=0){ pomoPause(); log(pomoLog,‘Finished’); } }
function pomoStart(){ if(pomoRunning) return; setPomoCadence(); pomoRunning=true; pomoTick=setInterval(tickPomo, pomoStep); log(pomoLog,`Started (${fmtPomo()})`); }
function pomoPause(){ if(!pomoRunning) return; pomoRunning=false; clearInterval(pomoTick); drawPomo(); log(pomoLog,`Paused at ${fmtPomo()}`); }
function pomoStop(){ pomoRunning=false; clearInterval(pomoTick); pomoRemain=0; drawPomo(); log(pomoLog,‘Stopped’); }
function pomoReset(){ pomoRunning=false; clearInterval(pomoTick); pomoRemain=pomoDur; drawPomo(); log(pomoLog,‘Reset’); }

$$(’#pomodoro [data-preset-pomo]’).forEach(b=>b.onclick=()=>{
const s=parseInt(b.dataset.presetPomo,10)*1000;
pomoDur=s;
pomoRemain=s;
drawPomo();
log(pomoLog,`Preset ${b.textContent}`);
});

$$(’#pomodoro [data-pomo-combo]’).forEach(b=>b.onclick=()=>{
const parts=b.dataset.pomoCombo.split(’|’);
const work=Number(parts[0]||25)*60*1000;
pomoDur=work;
pomoRemain=work;
drawPomo();
log(pomoLog,`Set work/break: ${parts[0]}m / ${parts[1]}m`);
});

const pomoClearLog_btn = $(’#pomoClearLog’);
if(pomoClearLog_btn) pomoClearLog_btn.addEventListener(‘click’, ()=>pomoLog && (pomoLog.innerHTML=’’));
const pomoExportCSV_btn = $(’#pomoExportCSV’);
if(pomoExportCSV_btn) pomoExportCSV_btn.addEventListener(‘click’, ()=>exportListToCSV(pomoLog,‘pomodoro_log.csv’));
const pmExport_btn = $(’#pmExport’);
if(pmExport_btn) pmExport_btn.addEventListener(‘click’, ()=>exportListToCSV(pomoLog,‘pomodoro_log.csv’));
const pomoFullscreen_btn = $(’#pomoFullscreen’);
if(pomoFullscreen_btn) {
pomoFullscreen_btn.addEventListener(‘click’, ()=>
openFS(‘pomo’, pomoDigits?.textContent||‘25:00’, (pomoDur?pomoRemain/pomoDur:0), !pomoRunning && pomoRemain>0 && pomoRemain<pomoDur, pomoColor?.value, true)
);
}

/* ––––– Stopwatch ––––– */
let swRunning=false, swT0=0, swElapsed=0, swTick=null, swStep=50;
const swDigits=$(’#swTime’), swLaps=$(’#swLaps’);
const swHours=$(’#swHours’), swHund=$(’#swHundredths’), swColor=$(’#swColor’);
const swModal=$(’#swSettingsModal’);

const swSettings_btn = $(’#swSettings’);
if(swSettings_btn) swSettings_btn.addEventListener(‘click’, ()=>swModal?.classList.remove(‘hidden’));
const swClose_btn = $(’#swClose’);
if(swClose_btn) swClose_btn.addEventListener(‘click’, ()=>swModal?.classList.add(‘hidden’));
const swCancel_btn = $(’#swCancel’);
if(swCancel_btn) swCancel_btn.addEventListener(‘click’, ()=>swModal?.classList.add(‘hidden’));
const swToggleLog_btn = $(’#swToggleLog’);
if(swToggleLog_btn) swToggleLog_btn.addEventListener(‘click’, ()=>$(’#swLogCard’)?.classList.toggle(‘hidden’));

if(swHours) swHours.checked=(localStorage.getItem(LS.sH)||‘false’)===‘true’;
if(swHund) swHund.checked =(localStorage.getItem(LS.sHs)||‘true’)===‘true’;
if(swColor) {
swColor.value = localStorage.getItem(LS.sC) || ‘#e53935’;
if(swDigits) swDigits.style.color = swColor.value;
}

if(swHours) swHours.onchange=()=>{ localStorage.setItem(LS.sH, swHours.checked?‘true’:‘false’); drawSW(); };
if(swHund) swHund.onchange =()=>{ localStorage.setItem(LS.sHs, swHund.checked?‘true’:‘false’); swStep=swHund.checked?10:250; if(swRunning){ clearInterval(swTick); swTick=setInterval(drawSW, swStep); } drawSW(); };
if(swColor) swColor.oninput=e=>{ localStorage.setItem(LS.sC, e.target.value); if(swDigits) swDigits.style.color=e.target.value; if(fsMode===‘sw’) fsDigits.style.color=e.target.value; };

function fmtSW(ms){
const showH=swHours?.checked, showHund=swHund?.checked;
const hundredths=Math.floor((ms%1000)/10);
let totalSec=Math.floor(ms/1000);
const s=totalSec%60;
totalSec=Math.floor(totalSec/60);
const m=totalSec%60;
const h=Math.floor(totalSec/60);
const base=(showH||h>0)?`${pad(h)}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`;
return showHund?`${base}.${pad(hundredths)}`:base;
}

function drawSW(){
if(!swDigits) return;
const t=swElapsed+(swRunning?(Date.now()-swT0):0);
swDigits.textContent=fmtSW(t);
updateFS(‘sw’, 0, !swRunning && swElapsed>0, swDigits.textContent, swColor?.value, false);
}

function swStart(){ if(swRunning) return; swRunning=true; swT0=Date.now(); swTick=setInterval(drawSW, swStep); }
function swPause(){ if(!swRunning) return; swRunning=false; clearInterval(swTick); swElapsed+=Date.now()-swT0; drawSW(); }
function swReset(){ swRunning=false; clearInterval(swTick); swT0=0; swElapsed=0; if(swDigits) swDigits.textContent=fmtSW(0); if(swLaps) swLaps.innerHTML=’’; }
function swLap(){ drawSW(); if(!swLaps) return; const li=document.createElement(‘li’); li.textContent=swDigits.textContent; swLaps.prepend(li); }

const swStart_btn = $(’#swStart’);
if(swStart_btn) swStart_btn.addEventListener(‘click’, swStart);
const swPause_btn = $(’#swPause’);
if(swPause_btn) swPause_btn.addEventListener(‘click’, swPause);
const swReset_btn = $(’#swReset’);
if(swReset_btn) swReset_btn.addEventListener(‘click’, swReset);
const swLap_btn = $(’#swLap’);
if(swLap_btn) swLap_btn.addEventListener(‘click’, swLap);
const swExportCSV_btn = $(’#swExportCSV’);
if(swExportCSV_btn) swExportCSV_btn.addEventListener(‘click’, ()=>exportListToCSV(swLaps,‘stopwatch_laps.csv’,‘lap_time’));
const swExport2_btn = $(’#swExport2’);
if(swExport2_btn) swExport2_btn.addEventListener(‘click’, ()=>exportListToCSV(swLaps,‘stopwatch_laps.csv’,‘lap_time’));
const swFullscreen_btn = $(’#swFullscreen’);
if(swFullscreen_btn) {
swFullscreen_btn.addEventListener(‘click’, ()=>
openFS(‘sw’, swDigits?.textContent||‘00:00’, 0, !swRunning && swElapsed>0, swColor?.value, false)
);
}

/* ––––– Pro Timer ––––– */
// Supabase Configuration - Add your credentials here later
const SUPABASE_URL = ‘’; // Add your Supabase URL here (e.g., ‘https://your-project-id.supabase.co’)
const SUPABASE_ANON_KEY = ‘’; // Add your Supabase anon key here (starts with ‘eyJ0eXAi…’)

let proTimers = [], activeProTimer = null, proCurrentTime = 0, proIsRunning = false, proMessages = [], proTick = null;
let proView = ‘admin’, showQR = false;

// Simple Supabase client (only used if credentials are provided)
class SupabaseClient {
constructor(url, key) {
this.url = url;
this.key = key;
this.headers = {
‘Content-Type’: ‘application/json’,
‘Authorization’: `Bearer ${key}`,
‘apikey’: key
};
}

async query(table, method = ‘GET’, data = null, params = ‘’) {
if (!this.url || !this.key) return null;

```
const url = `${this.url}/rest/v1/${table}${params}`;
const options = {
  method,
  headers: this.headers
};

if (data && (method === 'POST' || method === 'PATCH')) {
  options.body = JSON.stringify(data);
}

try {
  const response = await fetch(url, options);
  return await response.json();
} catch (error) {
  console.error('Supabase query error:', error);
  return null;
}
```

}
}

// Initialize Supabase client (will work when credentials are added)
const supabase = new SupabaseClient(https://rjitcfqsjjsptbchvmxj.supabase.co, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqaXRjZnFzampzcHRiY2h2bXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODMwMTIsImV4cCI6MjA3MTU1OTAxMn0.IYH0Ee4AR_TgRmwc-GVepmS8eXWxVQeildXUKQpH0Tg);

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

// Check URL parameters for presenter mode
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
// Fallback
const input = document.createElement(‘input’);
input.value = url;
document.body.appendChild(input);
input.select();
document.execCommand(‘copy’);
document.body.removeChild(input);

```
const btn = $('#proCopyUrl');
if(btn) {
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy', 2000);
}
```

});
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

function toggleQRCode() {
showQR = !showQR;
renderProTimer();
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

container.innerHTML = `<div class="presenter-view"> <div class="presenter-timer"> <div class="presenter-time">${formatProTime(proCurrentTime)}</div> <div class="presenter-progress"> <div class="presenter-progress-bar" style="width: ${progress}%"></div> </div> ${activeProTimer ?`<div class="presenter-name">Presenter: ${activeProTimer.presenter}</div>` : ‘’}
</div>

```
  ${proMessages.length > 0 ? `
    <div class="presenter-messages">
      <h3>Messages from Control</h3>
      <div class="message-list">
        ${proMessages.slice(-5).reverse().map(msg => `
          <div class="message-item">
            <div class="message-text">${msg.text}</div>
            <div class="message-time">${msg.timestamp}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}
  
  <button onclick="proView='admin'; renderProTimer();" class="back-btn">← Back to Admin</button>
</div>
```

`;
}

function renderCreateView(container) {
container.innerHTML = `
<div class="pro-create">
<button onclick="proView='admin'; renderProTimer();" class="back-btn">← Back to Dashboard</button>

```
  <h2>Create New Timer</h2>
  
  <div class="form-group">
    <label>Timer Name</label>
    <input type="text" id="proTimerName" placeholder="e.g., Morning Presentation">
  </div>
  
  <div class="form-group">
    <label>Presenter Name</label>
    <input type="text" id="proPresenterName" placeholder="e.g., Bob">
  </div>
  
  <div class="form-group">
    <label>Duration (minutes)</label>
    <input type="number" id="proDuration" value="5" min="1">
  </div>
  
  <button onclick="createProTimer()" class="btn btn-primary">Create Timer</button>
</div>
```

`;
}

function renderAdminView(container) {
const progress = activeProTimer ? ((activeProTimer.duration - proCurrentTime) / activeProTimer.duration) * 100 : 0;

container.innerHTML = `
<div class="pro-admin">
<div class="admin-header">
<h2>Pro Timer Dashboard</h2>
<button onclick="proView='create'; renderProTimer();" class="btn btn-primary">+ Create Timer</button>
</div>

```
  <div class="admin-grid">
    <div class="admin-left">
      <div class="card">
        <h3>🎯 Your Timers</h3>
        ${proTimers.length === 0 ? `
          <div class="empty-state">No timers created yet. Create your first timer to get started.</div>
        ` : `
          <div class="timer-list">
            ${proTimers.map(timer => `
              <div class="timer-item ${activeProTimer?.id === timer.id ? 'active' : ''}" 
                   onclick="startProTimer(${JSON.stringify(timer).replace(/"/g, '&quot;')})">
                <div class="timer-info">
                  <h4>${timer.name}</h4>
                  <p>Presenter: ${timer.presenter}</p>
                  <p class="timer-meta">Duration: ${Math.floor(timer.duration / 60)} minutes • Created: ${timer.created}</p>
                </div>
                ${activeProTimer?.id === timer.id ? '<span class="active-badge">Active</span>' : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>
      
      ${activeProTimer ? `
        <div class="card">
          <h3>⏱️ Timer Controls</h3>
          <div class="timer-display">
            <div class="time-large">${formatProTime(proCurrentTime)}</div>
            <div class="timer-name">${activeProTimer.name}</div>
            <div class="progress-wrapper">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
            </div>
          </div>
          
          <div class="control-buttons">
            <button onclick="toggleProTimer()" class="btn ${proIsRunning ? 'btn-warning' : 'btn-primary'}">
              ${proIsRunning ? '⏸️ Pause' : '▶️ Start'}
            </button>
            <button onclick="stopProTimer()" class="btn btn-danger">⏹️ Stop</button>
            <button onclick="resetProTimer()" class="btn btn-secondary">🔄 Reset</button>
          </div>
        </div>
      ` : ''}
    </div>
    
    <div class="admin-right">
      ${activeProTimer ? `
        <div class="card">
          <h3>💬 Send Message to ${activeProTimer.presenter}</h3>
          
          <div class="message-input">
            <input type="text" id="proMessageInput" placeholder="Type a message for the presenter..." 
                   onkeypress="if(event.key==='Enter') sendProMessage()">
            <button onclick="sendProMessage()" class="btn btn-primary">Send</button>
          </div>
          
          <div class="quick-messages">
            <label>Quick Messages:</label>
            <div class="quick-btn-grid">
              ${['5 minutes remaining', '2 minutes left', 'Please wrap up', 'Great job!', 'Take your time', 'Questions coming up'].map(msg => `
                <button onclick="sendQuickMessage('${msg.replace(/'/g, "\\'")}')" class="quick-btn">${msg}</button>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="card">
          <h3>🔗 Share Presenter View</h3>
          
          <div class="share-options">
            <div class="url-section">
              <label>Presenter URL:</label>
              <div class="url-input">
                <input type="text" value="${getPresenterUrl()}" readonly>
                <button onclick="copyPresenterUrl()" id="proCopyUrl" class="btn btn-secondary">Copy</button>
              </div>
            </div>
            
            <div class="share-buttons">
              <button onclick="toggleQRCode()" class="btn btn-success">
                ${showQR ? '🔗 Hide QR Code' : '🔗 Generate QR Code'}
              </button>
              <button onclick="proView='presenter'; renderProTimer();" class="btn btn-info">👁️ Preview</button>
            </div>
            
            ${showQR ? `
              <div class="qr-container">
                <img src="${generateQRCode(getPresenterUrl())}" alt="QR Code" class="qr-image">
                <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
                  Scan to open presenter view
                </p>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="card">
          <h3>📋 Message History</h3>
          ${proMessages.length === 0 ? `
            <div class="empty-state">No messages sent yet.</div>
          ` : `
            <div class="message-history">
              ${proMessages.slice(-10).reverse().map(msg => `
                <div class="history-item">
                  <div class="message-text">${msg.text}</div>
                  <div class="message-timestamp">Sent at ${msg.timestamp}</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      ` : `
        <div class="card">
          <h3>🚀 How It Works</h3>
          <div class="guide-steps">
            <div class="step">
              <span class="step-number">1</span>
              <div>
                <h4>Create a Timer</h4>
                <p>Set up a named timer with presenter details and duration.</p>
              </div>
            </div>
            <div class="step">
              <span class="step-number">2</span>
              <div>
                <h4>Share with Presenter</h4>
                <p>Generate a QR code or share the URL for the presenter display.</p>
              </div>
            </div>
            <div class="step">
              <span class="step-number">3</span>
              <div>
                <h4>Control & Communicate</h4>
                <p>Start the timer and send real-time messages to the presenter.</p>
              </div>
            </div>
          </div>
        </div>
      `}
    </div>
  </div>
</div>
```

`;
}

// Global functions for onclick handlers
window.createProTimer = createProTimer;
window.startProTimer = (timerData) => {
startProTimer(timerData);
};
window.toggleProTimer = toggleProTimer;
window.stopProTimer = stopProTimer;
window.resetProTimer = resetProTimer;
window.sendProMessage = sendProMessage;
window.sendQuickMessage = sendQuickMessage;
window.copyPresenterUrl = copyPresenterUrl;
window.toggleQRCode = toggleQRCode;

/* ––––– FS update while open ––––– */
function updateFS(mode, ratio, paused, text, color, showBar){
if(fsMode!==mode) return;
if(!fsDigits) return;
fsDigits.textContent=text;
fsDigits.style.color=color||’’;
setFsFont(text);
if(fsBarWrap) fsBarWrap.style.display=showBar?‘block’:‘none’;
if(showBar && fsBar && fsElapsed){
const r=Math.max(0,Math.min(1,ratio||0));
fsBar.style.transform=`scaleX(${r})`;
fsElapsed.style.width=`${(1-r)*100}%`;
}
if(fsStatus) fsStatus.style.display=paused?‘block’:‘none’;
}

if(fsDigits) {
fsDigits.addEventListener(‘click’, ()=>{
if(fsMode===‘main’){ if(mainRunning) mainPause(); else mainStart(); }
else if(fsMode===‘pomo’){ if(pomoRunning) pomoPause(); else pomoStart(); }
else if(fsMode===‘sw’){ if(swRunning) swPause(); else swStart(); }
});
}

/* ––––– Init ––––– */
function init(){
// Check for presenter mode on page load
const urlParams = new URLSearchParams(window.location.search);
if(urlParams.get(‘view’) === ‘presenter’) {
show(screens.indexOf(‘proTimer’));
} else {
show(0);
}

if(mainDigits) drawMain();
if(pomoDigits) drawPomo();
if(swDigits) drawSW();
}

init();

// Enhanced resize handler
window.addEventListener(‘resize’, ()=>{
try{if(mainDigits) drawMain();}catch(e){}
try{if(pomoDigits) drawPomo();}catch(e){}
try{if(swDigits) drawSW();}catch(e){}
});
/* ––––– Pro Timer Enhanced Fix ––––– */
// Add this code to the end of your script.js file, just before the closing })();

// Enhanced Pro Timer functions
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
renderProTimerFull();
}

function startProTimer(timer) {
activeProTimer = timer;
proCurrentTime = timer.duration;
proIsRunning = false;
proMessages = [];
saveProMessages();
renderProTimerFull();
}

function toggleProTimer() {
if(!activeProTimer) return;

proIsRunning = !proIsRunning;

if(proIsRunning) {
proTick = setInterval(() => {
proCurrentTime = Math.max(0, proCurrentTime - 1);
renderProTimerFull();

```
  if(proCurrentTime <= 0) {
    proIsRunning = false;
    clearInterval(proTick);
    renderProTimerFull();
  }
}, 1000);
```

} else {
clearInterval(proTick);
}

renderProTimerFull();
}

function stopProTimer() {
proIsRunning = false;
clearInterval(proTick);
proCurrentTime = 0;
renderProTimerFull();
}

function resetProTimer() {
proIsRunning = false;
clearInterval(proTick);
if(activeProTimer) {
proCurrentTime = activeProTimer.duration;
}
renderProTimerFull();
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
renderProTimerFull();
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
renderProTimerFull();
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
// Fallback
alert(’Copied to clipboard: ’ + url);
});
}

function toggleQRCode() {
showQR = !showQR;
renderProTimerFull();
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

function renderProTimerFull() {
const container = $(’#proTimer’);
if(!container) return;

if(proView === ‘presenter’) {
renderPresenterViewFull(container);
} else if(proView === ‘create’) {
renderCreateViewFull(container);
} else {
renderAdminViewFull(container);
}
}

function renderPresenterViewFull(container) {
const progress = activeProTimer ? ((activeProTimer.duration - proCurrentTime) / activeProTimer.duration) * 100 : 0;

container.innerHTML = `
<div style="min-height: 100vh; background: var(--bg-primary); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; position: relative;">
<button onclick="proView='admin'; renderProTimerFull();" style="position: fixed; top: 1rem; left: 1rem; background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-color); padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.875rem; z-index: 100;">
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

function renderCreateViewFull(container) {
container.innerHTML = `
<div style="padding: 2rem; max-width: 600px; margin: 0 auto;">
<button onclick="proView='admin'; renderProTimerFull();" style="color: #60a5fa; background: none; border: none; margin-bottom: 2rem; cursor: pointer; font-size: 0.875rem;">
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

function renderAdminViewFull(container) {
const progress = activeProTimer ? ((activeProTimer.duration - proCurrentTime) / activeProTimer.duration) * 100 : 0;

container.innerHTML = `
<div style="padding: 2rem; max-width: 1400px; margin: 0 auto;">
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
<h2 style="font-size: 2rem; font-weight: bold; color: var(--text-primary); margin: 0;">Pro Timer Dashboard</h2>
<button onclick="proView='create'; renderProTimerFull();" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;">
+ Create Timer
</button>
</div>

```
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
    <div>
      <div style="background: var(--bg-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid var(--border-color); box-shadow: 0 2px 4px var(--shadow);">
        <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          🎯 Your Timers
        </h3>
        ${proTimers.length === 0 ? `
          <div style="color: var(--text-secondary); text-align: center; padding: 3rem 2rem; font-style: italic; background: var(--bg-secondary); border-radius: 8px; border: 2px dashed var(--border-color);">
            No timers created yet. Create your first timer to get started.
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${proTimers.map(timer => `
              <div onclick="startProTimer(${JSON.stringify(timer).replace(/"/g, '&quot;')})" style="padding: 1.25rem; background: ${activeProTimer?.id === timer.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)'}; border: 2px solid ${activeProTimer?.id === timer.id ? '#3b82f6' : 'var(--border-color)'}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; position: relative;">
                <div>
                  <h4 style="color: var(--text-primary); margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 600;">${timer.name}</h4>
                  <p style="color: var(--text-secondary); margin: 0; font-size: 0.875rem; line-height: 1.4;">Presenter: ${timer.presenter}</p>
                  <p style="color: var(--text-muted); font-size: 0.75rem; margin: 0;">Duration: ${Math.floor(timer.duration / 60)} minutes • Created: ${timer.created}</p>
                </div>
                ${activeProTimer?.id === timer.id ? '<span style="position: absolute; top: 1rem; right: 1rem; background: #3b82f6; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Active</span>' : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>
      
      ${activeProTimer ? `
        <div style="background: var(--bg-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid var(--border-color); box-shadow: 0 2px 4px var(--shadow);">
          <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600;">⏱️ Timer Controls</h3>
          <div style="text-align: center; margin-bottom: 1.5rem; padding: 1rem; background: rgba(0,0,0,0.05); border-radius: 8px;">
            <div style="font-size: clamp(2rem, 6vw, 3rem); font-weight: bold; color: #e53935; font-family: 'Courier New', monospace; margin-bottom: 0.5rem; line-height: 1;">
              ${formatProTime(proCurrentTime)}
            </div>
            <div style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 1rem;">${activeProTimer.name}</div>
            <div style="margin: 1rem 0;">
              <div style="width: 100%; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; background: linear-gradient(to right, #10b981 0%, #f59e0b 70%, #ef4444 100%); transition: width 1s ease-linear; border-radius: 4px; width: ${progress}%;"></div>
              </div>
            </div>
          </div>
          
          <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
            <button onclick="toggleProTimer()" style="padding: 0.75rem 1.5rem; background: ${proIsRunning ? '#f59e0b' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)'}; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.5rem;">
              ${proIsRunning ? '⏸️ Pause' : '▶️ Start'}
            </button>
            <button onclick="stopProTimer()" style="padding: 0.75rem 1.5rem; background: #ef4444; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.5rem;">
              ⏹️ Stop
            </button>
            <button onclick="resetProTimer()" style="padding: 0.75rem 1.5rem; background: #6b7280; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.5rem;">
              🔄 Reset
            </button>
          </div>
        </div>
      ` : ''}
    </div>
    
    <div>
      ${activeProTimer ? `
        <div style="background: var(--bg-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid var(--border-color); box-shadow: 0 2px 4px var(--shadow);">
          <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
            💬 Send Message to ${activeProTimer.presenter}
          </h3>
          
          <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
            <input type="text" id="proMessageInput" placeholder="Type a message for the presenter..." onkeypress="if(event.key==='Enter') sendProMessage()" style="flex: 1; padding: 0.875rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 1rem; min-width: 0;">
            <button onclick="sendProMessage()" style="padding: 0.875rem 1.5rem; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">Send</button>
          </div>
          
          <div style="margin-top: 1.5rem;">
            <label style="display: block; color: var(--text-primary); margin-bottom: 0.75rem; font-size: 0.875rem; font-weight: 500;">Quick Messages:</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem;">
              ${['5 minutes remaining', '2 minutes left', 'Please wrap up', 'Great job!', 'Take your time', 'Questions coming up'].map(msg => `
                <button onclick="sendQuickMessage('${msg.replace(/'/g, "\\'")}')" style="padding: 0.625rem 1rem; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                  ${msg}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div style="background: var(--bg-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid var(--border-color); box-shadow: 0 2px 4px var(--shadow);">
          <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600;">🔗 Share Presenter View</h3>
          
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500;">Presenter URL:</label>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" value="${getPresenterUrl()}" readonly style="flex: 1; padding: 0.875rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-family: 'Courier New', monospace; font-size: 0.875rem; min-width: 0;">
                <button onclick="copyPresenterUrl()" id="proCopyUrl" style="padding: 0.875rem 1.5rem; background: #6b7280; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;">Copy</button>
              </div>
            </div>
            
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button onclick="toggleQRCode()" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;">
                🔗 ${showQR ? 'Hide QR Code' : 'Generate QR Code'}
              </button>
              <button onclick="proView='presenter'; renderProTimerFull();" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #8b5cf6; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;">
                👁️ Preview
              </button>
            </div>
            
            ${showQR ? `
              <div style="text-align: center; padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                <img src="${generateQRCode(getPresenterUrl())}" alt="QR Code" style="max-width: 160px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px var(--shadow);">
                <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
                  Scan to open presenter view
                </p>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="background: var(--bg-card); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border-color); box-shadow: 0 2px 4px var(--shadow);">
          <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600;">📋 Message History</h3>
          ${proMessages.length === 0 ? `
            <div style="color: var(--text-secondary); text-align: center; padding: 3rem 2rem; font-style: italic; background: var(--bg-secondary); border-radius: 8px; border: 2px dashed var(--border-color);">
              No messages sent yet.
            </div>
          ` : `
            <div style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem;">
              ${proMessages.slice(-10).reverse().map(msg => `
                <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1rem; border-left: 3px solid #60a5fa;">
                  <div style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 1rem;">${msg.text}</div>
                  <div style="color: var(--text-secondary); font-size: 0.75rem;">Sent at ${msg.timestamp}</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      ` : `
        <div style="background: var(--bg-card); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border-color); box-shadow: 0 2px 4px var(--shadow);">
          <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
            🚀 How It Works
          </h3>
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div style="display: flex; gap: 1rem; align-items: flex-start;">
              <span style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: bold; flex-shrink: 0; margin-top: 0.125rem; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">1</span>
              <div>
                <h4 style="color: var(--text-primary); margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 600;">Create a Timer</h4>
                <p style="color: var(--text-secondary); margin: 0; font-size: 0.875rem; line-height: 1.5;">Set up a named timer with presenter details and duration.</p>
              </div>
            </div>
            <div style="display: flex; gap: 1rem; align-items: flex-start;">
              <span style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: bold; flex-shrink: 0; margin-top: 0.125rem; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">2</span>
              <div>
                <h4 style="color: var(--text-primary); margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 600;">Share with Presenter</h4>
                <p style="color: var(--text-secondary); margin: 0; font-size: 0.875rem; line-height: 1.5;">Generate a QR code or share the URL for the presenter display.</p>
              </div>
            </div>
            <div style="display: flex; gap: 1rem; align-items: flex-start;">
              <span style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f
```
})();
