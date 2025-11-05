const IMG_DIR = "src/game/img/";
const TEXT_URL = "src/game/text/q1_text.json";
const ANSWER_URL = "src/game/answer/q1_answer.json";

let images = ["1-1.jpg","1-2.jpg","1-3.jpg"];
let texts = [];
let answer = null;

const imgPool = document.getElementById("imgPool");
const textPool = document.getElementById("textPool");
const board = document.getElementById("board");

const overlay = document.getElementById("confirmOverlay");
const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const resetBtn = document.getElementById("resetBtn");

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

function createImgCard(name){
  const d = document.createElement("div");
  d.className = "card img";
  d.draggable = true;
  d.dataset.type = "img";
  d.dataset.id = name;
  const img = document.createElement("img");
  img.src = IMG_DIR + name;
  img.alt = name;
  d.appendChild(img);
  attachDnD(d);
  return d;
}
function createTextCard(text){
  const d = document.createElement("div");
  d.className = "card text";
  d.draggable = true;
  d.dataset.type = "text";
  d.dataset.id = text;
  d.textContent = text;
  attachDnD(d);
  return d;
}

function createSlotRow(i){
  const row = document.createElement("div");
  row.className = "slot";
  const tImg = document.createElement("div");
  tImg.className = "target img";
  tImg.dataset.accept = "img";
  tImg.dataset.slot = i;
  enableDrop(tImg);

  const tTxt = document.createElement("div");
  tTxt.className = "target text";
  tTxt.dataset.accept = "text";
  tTxt.dataset.slot = i;
  enableDrop(tTxt);

  row.appendChild(tImg);
  row.appendChild(tTxt);
  board.appendChild(row);
}

function attachDnD(el){
  el.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", JSON.stringify({
      type: el.dataset.type,
      id: el.dataset.id
    }));
  });
}

function enableDrop(target){
  target.addEventListener("dragover", e => { e.preventDefault(); });
  target.addEventListener("drop", e => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    if (data.type !== target.dataset.accept) return;

    if (target.firstChild){ sendBack(target.firstChild); target.innerHTML=""; }

    const card = (data.type === "img") ? createImgCard(data.id) : createTextCard(data.id);
    card.dataset.origin = "slot";
    card.dataset.slot = target.dataset.slot;
    target.classList.add("filled");
    target.innerHTML = "";
    target.appendChild(card);

    checkFull();
  });
}

function sendBack(card){
  if (card.dataset.type === "img"){
    imgPool.appendChild(createImgCard(card.dataset.id));
  } else {
    textPool.appendChild(createTextCard(card.dataset.id));
  }
}

function populatePools(){
  imgPool.innerHTML = "";
  textPool.innerHTML = "";
  shuffle(images.slice()).forEach(n => imgPool.appendChild(createImgCard(n)));
  shuffle(texts.slice()).forEach(t => textPool.appendChild(createTextCard(t)));
}

function buildBoard(){
  board.innerHTML = "";
  for (let i=0;i<3;i++) createSlotRow(i);
}

function checkFull(){
  const filled = board.querySelectorAll(".target.filled").length;
  if (filled === 6){ overlay.classList.remove("hidden"); }
}

function collectAnswer(){
  const rows = Array.from(board.querySelectorAll(".slot"));
  return rows.map(r => {
    const imgBox = r.querySelector('.target.img .card');
    const txtBox = r.querySelector('.target.text .card');
    return { img: imgBox ? imgBox.dataset.id : null, text: txtBox ? txtBox.dataset.id : null };
  });
}

function checkAnswer(){
  const result = collectAnswer();
  const orderOK = result.every((row, i) => row.text === answer.order[i]);
  const pairsOK = result.every(row => answer.pairs[row.img] === row.text);
  return orderOK && pairsOK;
}

function resetAll(){
  buildBoard();
  populatePools();
  overlay.classList.add("hidden");
}

async function init(){
  try{
    const tRes = await fetch(TEXT_URL);
    if (!tRes.ok) throw new Error(`讀取文字失敗：${TEXT_URL}（HTTP ${tRes.status}）`);
    texts = await tRes.json();
  }catch(err){
    console.error(err);
    alert("讀取文字失敗，請檢查 q1_text.json 路徑；若是用 file:// 開啟，請改用 http 伺服器。");
    return;
  }

  try{
    const aRes = await fetch(ANSWER_URL);
    if (!aRes.ok) throw new Error(`讀取答案失敗：${ANSWER_URL}（HTTP ${aRes.status}）`);
    answer = await aRes.json();
  }catch(err){
    console.error(err);
    alert("讀取答案失敗，請檢查 q1_answer.json 路徑；若是用 file:// 開啟，請改用 http 伺服器。");
    return;
  }
  buildBoard();
  populatePools();
}

okBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  if (checkAnswer()){ alert("恭喜過關！"); }
  else { alert("再試一次！"); resetAll(); }
});
cancelBtn.addEventListener("click", () => overlay.classList.add("hidden"));
resetBtn.addEventListener("click", resetAll);

init();
