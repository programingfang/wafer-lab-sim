// === game_qid.js (UI 改版：橫向 + 排好了 + 百分比) ===
(function(){
  // 計算 BASE（讓 GitHub Pages / 本機都能用）
  const seg = window.location.pathname.split('/').filter(Boolean);
  const BASE = seg.length > 0 ? ('/' + seg[0] + '/') : '/';

  function getQid(){
    const params = new URLSearchParams(window.location.search);
    const q = parseInt(params.get('qid') || '1', 10);
    return Number.isFinite(q) && q > 0 ? q : 1;
  }
  const QID = getQid();

  // 本題資源
  const IMG_DIR    = BASE + "src/game/img/";
  const TEXT_URL   = BASE + `src/game/text/q${QID}_text.json`;
  const ANSWER_URL = BASE + `src/game/answer/q${QID}_answer.json`;

  // 本題圖片（QID-1.jpg ~ QID-3.jpg）
  let images = [ `${QID}-1.jpg`, `${QID}-2.jpg`, `${QID}-3.jpg` ];
  let texts = [];
  let answer = null;

  // 區塊
  const imgPool = document.getElementById("imgPool");
  const textPool = document.getElementById("textPool");

  // 右側三欄 targets
  const targets = Array.from(document.querySelectorAll(".target"));
  const submitBtn = document.getElementById("submitBtn");
  const resetBtn = document.getElementById("resetBtn");

  // 結果彈窗
  const overlay = document.getElementById("resultOverlay");
  const resultText = document.getElementById("resultText");
  const backBtn = document.getElementById("backBtn");
  const continueBtn = document.getElementById("continueBtn");

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
    img.onerror = () => console.error("載入圖片失敗：", img.src);
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

  function attachDnD(el){
    el.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", JSON.stringify({
        type: el.dataset.type,
        id: el.dataset.id
      }));
    });
  }

  // 啟用拖放到 target
  targets.forEach(t => {
    t.addEventListener("dragover", e => e.preventDefault());
    t.addEventListener("drop", e => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.type !== t.dataset.accept) return;
      // 若已有子元素，先退回原位
      if (t.firstChild){ sendBack(t.firstChild); t.innerHTML=""; }
      const card = (data.type === "img") ? createImgCard(data.id) : createTextCard(data.id);
      card.dataset.origin = "slot";
      card.dataset.slot = t.dataset.slot;
      t.classList.add("filled");
      t.innerHTML = "";
      t.appendChild(card);
    });
  });

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

  function collectAnswer(){
    // 收集三欄的 {img, text}
    const cols = [0,1,2].map(i => {
      const imgBox = document.querySelector(`.target.img[data-slot="${i}"] .card`);
      const txtBox = document.querySelector(`.target.text[data-slot="${i}"] .card`);
      return {
        img:  imgBox ? imgBox.dataset.id  : null,
        text: txtBox ? txtBox.dataset.id : null
      };
    });
    return cols;
  }

  function scoreAnswer(){
    const cols = collectAnswer();
    let correctCols = 0;
    for (let i=0;i<3;i++){
      const wantText = (answer.order || [])[i];
      const row = cols[i];
      if (!row.img || !row.text) continue; // 未填滿不計分
      const pairOK = (answer.pairs || {})[row.img] === row.text;
      const orderOK = row.text === wantText;
      if (pairOK && orderOK) correctCols += 1;
    }
    const percent = Math.round((correctCols / 3) * 100);
    return { percent, filled: cols.every(r => r.img && r.text) };
  }

  function resetAll(){
    // 清空右側、重新洗牌左右池
    targets.forEach(t => { t.innerHTML=""; t.classList.remove("filled"); });
    populatePools();
    overlay.classList.add("hidden");
  }

  // 事件：排好了 -> 算分 + 顯示彈窗
  submitBtn.addEventListener("click", () => {
    const { percent, filled } = scoreAnswer();
    resultText.textContent = `已達正確 ${percent}%`;
    overlay.classList.remove("hidden");
  });

  // 回去看影片 / 繼續作答
  backBtn.addEventListener("click", () => {
    window.location.href = "choose_video.html";
  });
  continueBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
  });

  // 重製
  resetBtn.addEventListener("click", resetAll);

  async function init(){
    try{
      const tRes = await fetch(TEXT_URL);
      if (!tRes.ok) throw new Error(`讀取文字失敗：${TEXT_URL}（HTTP ${tRes.status}）`);
      texts = await tRes.json();
      const aRes = await fetch(ANSWER_URL);
      if (!aRes.ok) throw new Error(`讀取答案失敗：${ANSWER_URL}（HTTP ${aRes.status}）`);
      answer = await aRes.json();
    }catch(err){
      console.error(err);
      alert("讀取題目/答案失敗，請檢查路徑與是否透過 http(s) 伺服器開啟。");
      return;
    }
    populatePools();
  }

  init();
})();
