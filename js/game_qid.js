/* 關卡頁（figure 區改版 + 拖拉不複製）
 * 題庫：src/game/text/q{qid}_prompt.json
 * { title, coachText, video, images:[...], order:[...], pairs:{img:text}, coach:"coach_large.png" }
 */
(function () {
  // 取得 qid
  const params = new URLSearchParams(location.search);
  const QID = (() => {
    const q = parseInt(params.get("qid") || "1", 10);
    return Number.isFinite(q) && q > 0 ? q : 1;
  })();

  // 路徑
  const IMG_DIR = `src/game/img/`;
  const PROMPT_URL = `src/game/text/q${QID}_prompt.json`;

  // DOM
  const bigPrompt   = document.getElementById("bigPrompt");
  const imgPool     = document.getElementById("imgPool");
  const textPool    = document.getElementById("textPool");
  const targets     = Array.from(document.querySelectorAll(".target"));
  const submitBtn   = document.getElementById("submitBtn");
  const resetBtn    = document.getElementById("resetBtn");
  const overlay     = document.getElementById("resultOverlay");
  const resultText  = document.getElementById("resultText");
  const leftBtn     = document.getElementById("leftActionBtn");
  const rightBtn    = document.getElementById("rightActionBtn");
  const coachTextEl = document.getElementById("coachText");
  const coachImage  = document.getElementById("coachImage");
  const detailList = document.getElementById("detailList");   // 新增：列表節點

  // 題庫
  let DATA = null;
  let images = [];
  let texts  = [];

  // ======= 拖拉處理（不複製，僅移動） =======
  let UID_SEQ = 1;
  function uid() { return "card-" + (UID_SEQ++); }

  function createImgCard(name){
    const d = document.createElement("div");
    d.className = "card img";
    d.draggable = true;
    d.dataset.type = "img";
    d.dataset.id = name;
    d.dataset.uid = uid();

    const img = document.createElement("img");
    img.src = IMG_DIR + name;
    img.alt = name;
    d.appendChild(img);

    bindDrag(d);
    return d;
  }
  function createTextCard(text){
    const d = document.createElement("div");
    d.className = "card text";
    d.draggable = true;
    d.dataset.type = "text";
    d.dataset.id = text;
    d.dataset.uid = uid();
    d.textContent = text;

    bindDrag(d);
    return d;
  }
  function bindDrag(card){
    card.addEventListener("dragstart", (e)=>{
      e.dataTransfer.effectAllowed = "move";
      const payload = {
        type: card.dataset.type,
        id: card.dataset.id,
        uid: card.dataset.uid,
        from: card.parentElement && card.parentElement.classList.contains("target")
              ? { kind:"target", slot: card.parentElement.dataset.slot, accept: card.parentElement.dataset.accept }
              : { kind:"pool" }
      };
      e.dataTransfer.setData("application/json", JSON.stringify(payload));
    });
  }

  function moveCardToTarget(card, target){
    // 若 target 先前有卡，先把舊卡丟回來源池
    if (target.firstChild) { moveCardBack(target.firstChild); target.innerHTML = ""; }
    target.classList.add("filled");
    target.appendChild(card);
  }

  function moveCardBack(card){
    // 回到對應來源池（依卡片 type）
    if (card.dataset.type === "img") imgPool.appendChild(card);
    else textPool.appendChild(card);
  }

  targets.forEach(t=>{
    t.addEventListener("dragover", e=> e.preventDefault());
    t.addEventListener("drop", (e)=>{
      e.preventDefault();
      let data; try{ data = JSON.parse(e.dataTransfer.getData("application/json")); }catch{ return; }
      if (!data || data.type !== t.dataset.accept) return;

      const card = document.querySelector(`[data-uid="${data.uid}"]`);
      if (!card) return;

      // 若來源是另一個 target，把來源那格清空樣式
      if (card.parentElement && card.parentElement.classList.contains("target")) {
        card.parentElement.classList.remove("filled");
      }
      moveCardToTarget(card, t);
    });
  });

  // 允許把卡片拖回來源池（整個 pool 當 drop 區）
  [imgPool, textPool].forEach(pool=>{
    pool.addEventListener("dragover", e=> e.preventDefault());
    pool.addEventListener("drop", (e)=>{
      e.preventDefault();
      let data; try{ data = JSON.parse(e.dataTransfer.getData("application/json")); }catch{ return; }
      if (!data) return;

      const card = document.querySelector(`[data-uid="${data.uid}"]`);
      if (!card) return;

      if (card.parentElement && card.parentElement.classList.contains("target")) {
        card.parentElement.classList.remove("filled");
      }
      moveCardBack(card);
    });
  });

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a;}

  function populatePools(){
    imgPool.innerHTML = "";
    textPool.innerHTML = "";
    shuffle(images.slice()).forEach(n=> imgPool.appendChild(createImgCard(n)));
    const allTexts = Array.isArray(DATA.order) ? DATA.order.slice() : [];
    shuffle(allTexts).forEach(t=> textPool.appendChild(createTextCard(t)));
    texts = allTexts;
  }

  function collectRows(){
    return [0,1,2].map(i=>{
      const imgBox = document.querySelector(`.target.img[data-slot="${i}"] .card`);
      const txtBox = document.querySelector(`.target.text[data-slot="${i}"] .card`);
      return { img: imgBox ? imgBox.dataset.id : null, text: txtBox ? txtBox.dataset.id : null };
    });
  }

  function isAllCorrect(){
    if (!DATA) return false;
    const rows = collectRows();
    if (rows.some(r=>!r.img || !r.text)) return false;
    for (let i=0;i<3;i++){
      const wantText = (DATA.order || [])[i];
      const row = rows[i];
      const pairOK  = (DATA.pairs || {})[row.img] === row.text;
      const orderOK = row.text === wantText;
      if (!(pairOK && orderOK)) return false;
    }
    return true;
  }

  function doReset(){
    targets.forEach(t=>{ t.innerHTML=""; t.classList.remove("filled"); });
    populatePools();
  }



// 逐組檢查：回傳 [{ok:bool, img, text, wantText}, ...]
function judgeGroups() {
  const rows = collectRows(); // [{img, text}, ...]
  return [0,1,2].map((i) => {
    const wantText = (DATA.order || [])[i];
    const row = rows[i];
    const filled = !!row.img && !!row.text;
    const pairOK  = filled && (DATA.pairs || {})[row.img] === row.text;
    const orderOK = filled && row.text === wantText;
    return { ok: filled && pairOK && orderOK, img: row.img, text: row.text, wantText };
  });
}

if (submitBtn){
  submitBtn.addEventListener("click", ()=>{
    const judged = judgeGroups();
    const allOK  = judged.every(g => g.ok);

    // 產生逐組列表
    detailList.innerHTML = "";
    judged.forEach((g, idx) => {
      const li = document.createElement("li");
      li.className = g.ok ? "ok" : "ng";
      li.textContent = `第 ${idx+1} 組：` + (g.ok ? "對" : "錯");
      detailList.appendChild(li);
    });

    overlay.classList.remove("hidden");
    if (allOK){
      resultText.textContent = "結果：對";
      leftBtn.textContent = "恭喜過關!";
      rightBtn.textContent = "再玩一次";
      leftBtn.onclick = ()=> location.href = "index.html";
      rightBtn.onclick = ()=> location.href = "choose_video.html";
    } else {
      resultText.textContent = "結果：錯";
      leftBtn.textContent = "重看影片";
      rightBtn.textContent = "再試一次";
      leftBtn.onclick = ()=>{
        const ret = encodeURIComponent(`ic_game.html?qid=${QID}`);
        location.href = `choose_video.html?play=${QID}&return=${ret}`;
      };
      rightBtn.onclick = ()=>{
        overlay.classList.add("hidden");
        doReset();
      };
    }
  });
}

  if (resetBtn) resetBtn.addEventListener("click", doReset);

  // 初始化
  async function init(){
    try{
      const r = await fetch(PROMPT_URL);
      if (!r.ok) throw new Error(`讀取題庫失敗：${PROMPT_URL}`);
      DATA = await r.json();

      // 大標題
      if (DATA.title && bigPrompt) bigPrompt.textContent = DATA.title;

      // 右下對話框 + 教練圖
      if (DATA.coachText) coachTextEl.textContent = DATA.coachText;
      if (DATA.coach)     coachImage.src = IMG_DIR + DATA.coach;

      // 圖片清單
      images = Array.isArray(DATA.images) ? DATA.images.slice() : [];

      populatePools();
    }catch(err){
      console.error(err);
      alert("載入題庫失敗，請確認檔案路徑。");
    }
  }
  init();
})();
