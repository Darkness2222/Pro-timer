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
  setTimeout(() => btn.textContent = 'Copy',
```