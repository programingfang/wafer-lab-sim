let steps = [];
let correctOrder = [];
let objective = "";
let moves = 0;
let timer = 0;
let timerId = null;
let selectedCard = null;

const pool = document.getElementById("step-pool");
const flowArea = document.getElementById("flow-area");
const resultEl = document.getElementById("result");
const diffEl = document.getElementById("diff");
const trash = document.getElementById("trash");

const timerEl = document.getElementById("timer");
const movesEl = document.getElementById("moves");
const scoreEl = document.getElementById("score");
const objectiveEl = document.getElementById("objective");

function fmtT(s){ const m = Math.floor(s/60); const sec = s%60; return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0'); }
function startTimer(){
  if (timerId) clearInterval(timerId);
  timerId = setInterval(()=>{ timer++; timerEl.textContent = fmtT(timer); }, 1000);
}
function incMoves(){ moves++; movesEl.textContent = moves; }

function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }

function createCard(text){
  const card = document.createElement("div");
  card.className = "step-card";
  card.draggable = true;
  card.tabIndex = 0;
  card.textContent = text;
  card.dataset.step = text;

  // 點擊加入（行動裝置友好）
  card.addEventListener("click", () => {
    if (card.parentElement === pool) addToFlow(text);
  });

  card.addEventListener("dragstart", (e)=>{
    e.dataTransfer.setData("text/plain", text);
    const ghost = card.cloneNode(true);
    ghost.classList.add("badge");
    ghost.style.position="absolute"; ghost.style.top="-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    setTimeout(()=>document.body.removeChild(ghost),0);
  });
  card.addEventListener("focus", ()=>{ selectedCard = card; });
  return card;
}

function addToFlow(step){
  // 防重複
  const exists = Array.from(flowArea.querySelectorAll(".step-card")).some(c=>c.dataset.step === step);
  if (exists){ flashMsg("此步驟已在排列區"); return; }
  const card = createCard(step);
  if (flowArea.querySelector(".placeholder")) flowArea.innerHTML = "";
  flowArea.appendChild(card);
  incMoves();
}

function dropToFlow(event){
  event.preventDefault();
  const step = event.dataTransfer.getData("text/plain");
  if (!step) return;
  // 允許池→排列、或排列內重排
  const isReorder = Array.from(flowArea.querySelectorAll(".step-card")).some(c=>c.dataset.step === step);
  const after = getInsertAfter(flowArea, event.clientX, event.clientY);
  if (!isReorder){
    const card = createCard(step);
    if (flowArea.querySelector(".placeholder")) flowArea.innerHTML = "";
    flowArea.insertBefore(card, after);
  }else{
    // 重新排序
    const card = Array.from(flowArea.children).find(c=>c.dataset.step===step);
    if (card && card !== after){
      flowArea.insertBefore(card, after);
    }
  }
  incMoves();
}

function getInsertAfter(container, x, y){
  // 找出最近的插入位置（橫向換行布局）
  const cards = Array.from(container.querySelectorAll(".step-card"));
  for (const c of cards){
    const r = c.getBoundingClientRect();
    if (y < r.bottom){
      return (x < r.left + r.width/2) ? c : c.nextSibling;
    }
  }
  return null;
}

function dropToTrash(event){
  event.preventDefault();
  const step = event.dataTransfer.getData("text/plain");
  const card = Array.from(flowArea.children).find(c=>c.dataset.step===step);
  if (card){ flowArea.removeChild(card); incMoves(); }
  if (flowArea.children.length===0){
    flowArea.innerHTML = '<div class="placeholder">把步驟卡片拖曳到這裡（或點擊步驟池卡片加入） →</div>';
  }
}

function renderPool(){
  pool.innerHTML = "";
  shuffle([...steps]).forEach(s=> pool.appendChild(createCard(s)) );
}

function currentFlow(){
  return Array.from(flowArea.querySelectorAll(".step-card")).map(c=>c.dataset.step);
}

function submitFlow(){
  const placed = currentFlow();
  if (placed.length !== correctOrder.length){
    showResult(false, "步驟數量不正確，請完成所有步驟。");
    return;
  }
  // 標示對/錯
  Array.from(flowArea.querySelectorAll(".step-card")).forEach((c,i)=>{
    c.classList.toggle("correct", placed[i]===correctOrder[i]);
    c.classList.toggle("wrong", placed[i]!==correctOrder[i]);
  });
  const ok = placed.every((s,i)=> s===correctOrder[i]);
  const wrongIdx = placed.findIndex((s,i)=> s!==correctOrder[i]);
  const diff = placed.map((s,i)=> `${i+1}. ${s}  →  ${correctOrder[i]} ${s===correctOrder[i]?'✓':'✗'}`).join("\n");
  diffEl.textContent = diff;
  // 簡易分數：滿分 100，錯一個扣 15，再加上時間與步數懲罰
  let score = Math.max(0, 100 - (wrongIdx>=0 ? 15*(placed.length - placed.filter((s,i)=>s===correctOrder[i]).length) : 0) - Math.floor(timer/10) - Math.max(0, moves-steps.length));
  scoreEl.textContent = score;
  showResult(ok, ok ? "恭喜！順序正確。" : "順序不正確，請參考下方差異對照。");
  console.log("提交順序：", placed);
}

function showResult(ok, msg){
  resultEl.textContent = (ok ? "✅ " : "❌ ") + msg;
  resultEl.style.color = ok ? "#065f46" : "#b91c1c";
}

function resetFlow(){
  flowArea.innerHTML = '<div class="placeholder">把步驟卡片拖曳到這裡（或點擊步驟池卡片加入） →</div>';
  resultEl.textContent = "";
  diffEl.textContent = "";
  moves = 0; movesEl.textContent = moves;
  timer = 0; timerEl.textContent = "00:00";
  if (timerId) clearInterval(timerId);
  startTimer();
}

function clearFlow(){
  flowArea.innerHTML = '<div class="placeholder">把步驟卡片拖曳到這裡（或點擊步驟池卡片加入） →</div>';
}

function giveHint(){
  const placed = currentFlow();
  // 找第一個錯位的提醒正確答案
  for (let i=0;i<placed.length;i++){
    if (placed[i] !== correctOrder[i]){
      flashMsg(`第 ${i+1} 步應該是：${correctOrder[i]}`);
      return;
    }
  }
  if (placed.length < correctOrder.length){
    flashMsg(`下一步建議：${correctOrder[placed.length]}`);
  }else{
    flashMsg("目前順序看起來是正確的，提交看看！");
  }
}

function flashMsg(text){
  resultEl.textContent = text;
  resultEl.style.color = "#374151";
  setTimeout(()=>{ resultEl.textContent = ""; }, 1600);
}

function saveProgress(){
  const data = { placed: currentFlow(), moves, timer };
  localStorage.setItem("process_game_save", JSON.stringify(data));
  flashMsg("已儲存進度");
}

function loadProgress(){
  const raw = localStorage.getItem("process_game_save");
  if (!raw){ flashMsg("沒有儲存的進度"); return; }
  const data = JSON.parse(raw);
  clearFlow();
  for (const s of data.placed){
    const card = createCard(s);
    if (flowArea.querySelector(".placeholder")) flowArea.innerHTML="";
    flowArea.appendChild(card);
  }
  moves = data.moves || 0; movesEl.textContent = moves;
  timer = data.timer || 0; timerEl.textContent = fmtT(timer);
  flashMsg("已載入進度");
}

function onKey(e){
  if (!selectedCard || selectedCard.parentElement !== flowArea) return;
  if (e.key === "Delete" || e.key === "Backspace"){
    selectedCard.remove();
    incMoves();
    return;
  }
  if (e.key === "ArrowLeft"){
    const prev = selectedCard.previousElementSibling;
    if (prev){ flowArea.insertBefore(selectedCard, prev); incMoves(); }
  }
  if (e.key === "ArrowRight"){
    const next = selectedCard.nextElementSibling;
    if (next){ flowArea.insertBefore(next, next.nextSibling); incMoves(); }
  }
}

async function loadSteps(){
  const res = await fetch("steps.json");
  const data = await res.json();
  objective = data.objective;
  steps = data.steps;
  correctOrder = data.correctOrder;
  objectiveEl.textContent = objective;
  renderPool();
  resetFlow();
}

document.getElementById("shuffleBtn").addEventListener("click", ()=>{ renderPool(); incMoves(); });
document.getElementById("hintBtn").addEventListener("click", giveHint);
document.getElementById("saveBtn").addEventListener("click", saveProgress);
document.getElementById("loadBtn").addEventListener("click", loadProgress);
document.getElementById("submitBtn").addEventListener("click", submitFlow);
document.getElementById("resetBtn").addEventListener("click", resetFlow);
document.getElementById("clearBtn").addEventListener("click", clearFlow);
document.addEventListener("keydown", onKey);

loadSteps();
startTimer();
