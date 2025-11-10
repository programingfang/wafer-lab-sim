/* 關卡頁（整合）：放大UI、字體加倍、觸控拖曳、逐組判定列表、讀 q{qid}_prompt.json
 * q{qid}_prompt.json:
 * {
 *   "title": "請排列出 IC 是如何製造的",
 *   "coachText": "請把圖片與文字配成正確組合，並依序拖到上方三格！",
 *   "video": "ic_make_1.mp4",
 *   "images": ["1-1.jpg", "1-2.jpg", "1-3.jpg"],
 *   "order": ["設計","製造","封測"],
 *   "pairs": { "1-1.jpg":"設計","1-2.jpg":"製造","1-3.jpg":"封測" },
 *   "coach": "coach_large.png"
 * }
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
  const detailList  = document.getElementById("detailList");
  const coachTextEl = document.getElementById("coachText");
  const coachImage  = document.getElementById("coachImage");

  // 題庫
  let DATA = null;
  let images = [];
  let texts  = [];

  // ======= 拖拉處理（不複製，僅移動；支援滑鼠與觸控） =======
  let UID_SEQ = 1;
  function uid() { return "card-" + (UID_SEQ++); }

  function bindDesktopDrag(card){
    card.addEventListener("dragstart", (e)=>{
      e.dataTransfer.effectAllowed = "move";
      const payload = {
        type: card.dataset.type,
        id: card.dataset.id,
        uid: card.dataset.uid
      };
      e.dataTransfer.setData("application/json", JSON.stringify(payload));
    });
  }

  function enableTouchDrag(card) {
    let dragging = false;
    let startX = 0, startY = 0, offX = 0, offY = 0;

    const onTouchStart = (e) => {
      if (!e.touches || !e.touches[0]) return;
      dragging = true;
      const t = e.touches[0];
      const rect = card.getBoundingClientRect();
      offX = t.clientX - rect.left;
      offY = t.clientY - rect.top;
      startX = t.clientX;
      startY = t.clientY;

      // 讓卡片浮在最上層跟著手指
      card.style.position = "fixed";
      card.style.zIndex = "9999";
      card.style.left = `${t.clientX - offX}px`;
      card.style.top  = `${t.clientY - offY}px`;
    };

    const onTouchMove = (e) => {
      if (!dragging || !e.touches || !e.touches[0]) return;
      const t = e.touches[0];
      card.style.left = `${t.clientX - offX}px`;
      card.style.top  = `${t.clientY - offY}px`;
    };

    const onTouchEnd = (e) => {
      if (!dragging) return;
      dragging = false;

      // 還原定位
      card.style.position = "";
      card.style.left = "";
      card.style.top = "";
      card.style.zIndex = "";

      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const target = el && el.closest(".target");

      if (target && target.dataset.accept === card.dataset.type) {
        if (target.firstChild) moveCardBack(target.firstChild);
        if (card.parentElement && card.parentElement.classList.contains("target")) {
          card.parentElement.classList.remove("filled");
        }
        moveCardToTarget(card, target);
      } else {
        // 放回來源池
        if (card.parentElement && card.parentElement.classList.contains("target")) {
          card.parentElement.classList.remove("filled");
        }
        moveCardBack(card);
      }
    };

    card.addEventListener("touchstart", onTouchStart, { passive: true });
    card.addEventListener("touchmove",  onTouchMove,  { passive: true });
    card.addEventListener("touchend",   onTouchEnd);
  }

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

    bindDesktopDrag(d);
    enableTouchDrag(d);
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

    bindDesktopDrag(d);
    enableTouchDrag(d);
    return d;
  }

  function moveCardToTarget(card, target){
    if (target.firstChild) { moveCardBack(target.firstChild); target.innerHTML = ""; }
    target.classList.add("filled");
    target.appendChild(card);
  }

  function moveCardBack(card){
    if (card.dataset.type === "img") imgPool.appendChild(card);
    else textPool.appendChild(card);
  }

  // 目標區：滑鼠拖放
  targets.forEach(t=>{
    t.addEventListener("dragover", e=> e.preventDefault());
    t.addEventListener("drop", (e)=>{
      e.preventDefault();
      let data; try{ data = JSON.parse(e.dataTransfer.getData("application/json")); }catch{ return; }
      if (!data) return;
      if (data.type !== t.dataset.accept) return;

      const card = document.querySelector(`[data-uid="${data.uid}"]`);
      if (!card) return;

      if (card.parentElement && card.parentElement.classList.contains("target")) {
        card.parentElement.classList.remove("filled");
      }
      moveCardToTarget(card, t);
    });
  });

  // 來源池：滑鼠/觸控拖回
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

  // ===== 工具 =====
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

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

  // 逐組判定：圖文配對要正確且文字在正確欄位
  function judgeGroups() {
    if (!DATA) return [];
    const rows = collectRows();
    return [0,1,2].map((i)=>{
      const wantText = (DATA.order || [])[i];
      const r = rows[i];
      const filled = !!r.img && !!r.text;
      const pairOK  = filled && (DATA.pairs || {})[r.img] === r.text;
      const orderOK = filled && r.text === wantText;
      return { ok: filled && pairOK && orderOK, img: r.img, text: r.text, wantText };
    });
  }
  function isAllCorrect(){ const j = judgeGroups(); return j.length===3 && j.every(x=>x.ok); }

  function doReset(){
    targets.forEach(t=>{ t.innerHTML = ""; t.classList.remove("filled"); });
    populatePools();
  }

  // ===== 送出（顯示逐組結果 + 成功/失敗按鈕） =====
  if (submitBtn){
    submitBtn.addEventListener("click", ()=>{
      const judged = judgeGroups();
      const allOK  = judged.every(g=>g.ok);

      // 逐組列表
      if (detailList) {
        detailList.innerHTML = "";
        judged.forEach((g, idx)=>{
          const li = document.createElement("li");
          li.className = g.ok ? "ok" : "ng";
          li.textContent = `第 ${idx+1} 組：` + (g.ok ? "對" : "錯");
          detailList.appendChild(li);
        });
      }

      overlay.classList.remove("hidden");
      if (allOK){
        resultText.textContent = "結果：對";
        leftBtn.textContent = "恭喜過關!";
        rightBtn.textContent = "再玩一次";
        leftBtn.onclick = ()=> location.href = "index.html";
        rightBtn.onclick = ()=> location.href = "choose_video.html";
      }else{
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

  // ===== 初始化：讀整合題庫 =====
  async function init(){
    try{
      const r = await fetch(PROMPT_URL);
      if (!r.ok) throw new Error(`讀取題庫失敗：${PROMPT_URL}`);
      DATA = await r.json();

      // 大標題、對話框、教練圖
      if (DATA.title && bigPrompt) bigPrompt.textContent = DATA.title;
      if (DATA.coachText) coachTextEl.textContent = DATA.coachText;
      if (DATA.coach)     coachImage.src = IMG_DIR + DATA.coach;

      // 圖片清單
      images = Array.isArray(DATA.images) ? DATA.images.slice() : [];
      populatePools();
    }catch(err){
      console.error(err);
      alert("載入題庫失敗，請確認檔案路徑（請用 http(s) 伺服器開啟）");
    }
  }
  init();
})();
