/* 關卡頁：修正拖曳邏輯（不複製，只搬移）、觸控支援、結果統計 */
(function () {
  // 參數與路徑
  const params = new URLSearchParams(location.search);
  const QID = (() => {
    const q = parseInt(params.get("qid") || "1", 10);
    return Number.isFinite(q) && q > 0 ? q : 1;
  })();
  const IMG_DIR = "src/game/img/";
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
  const resultSummary = document.getElementById("resultSummary");
  const leftBtn     = document.getElementById("leftActionBtn");
  const rightBtn    = document.getElementById("rightActionBtn");
  const coachTextEl = document.getElementById("coachText");
  const coachImage  = document.getElementById("coachImage");

  // 題庫
  let DATA = null;
  let images = [];
  let texts  = [];

  // ====== 共用：唯一識別碼，確保「搬移、不複製」 ======
  let UID_SEQ = 1;
  const newUID = () => "uid-" + (UID_SEQ++);

  // ====== 建立卡片（只在初始化時建立，一律搬移不複製） ======
  function createImgCard(name){
    const d = document.createElement("div");
    d.className = "card img";
    d.dataset.type = "img";
    d.dataset.id   = name;
    d.dataset.uid  = newUID();
    d.draggable = true;

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
    d.dataset.type = "text";
    d.dataset.id   = text;
    d.dataset.uid  = newUID();
    d.draggable = true;
    d.textContent = text;

    bindDesktopDrag(d);
    enableTouchDrag(d);
    return d;
  }

  // ====== 滑鼠拖曳：只搬移，不新建 ======
  function bindDesktopDrag(card){
    card.addEventListener("dragstart", (e)=>{
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          uid: card.dataset.uid,
          type: card.dataset.type
        })
      );
    });
  }

  // ====== 觸控拖曳：只搬移，不新建 ======
  function enableTouchDrag(card){
  let dragging = false;
  let offX = 0, offY = 0;

  // 自動捲動控制
  let rafId = null;
  let autoScrollDir = 0; // -1 向上，1 向下，0 停止

  const startAutoScroll = () => {
    if (rafId) return;
    const step = () => {
      if (autoScrollDir !== 0) {
        // 每禎小步捲動，讓使用者能「拖著卡片」把頁面帶到作答區
        window.scrollBy(0, autoScrollDir * 8);
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
      }
    };
    rafId = requestAnimationFrame(step);
  };

  const stopAutoScroll = () => {
    autoScrollDir = 0;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const onTouchStart = (e)=>{
    const t = e.touches && e.touches[0];
    if (!t) return;

    const rect = card.getBoundingClientRect();
    offX = t.clientX - rect.left;
    offY = t.clientY - rect.top;

    // 讓卡片浮在最上層跟著手指移動
    card.style.position = "fixed";
    card.style.zIndex = "9999";
    card.style.left = `${t.clientX - offX}px`;
    card.style.top  = `${t.clientY - offY}px`;

    dragging = true;
  };

  const onTouchMove = (e)=>{
    if (!dragging) return;

    // 阻止瀏覽器的預設滾動，改由我們自己的自動捲動控制
    e.preventDefault();

    const t = e.touches && e.touches[0];
    if (!t) return;

    // 移動卡片
    card.style.left = `${t.clientX - offX}px`;
    card.style.top  = `${t.clientY - offY}px`;

    // 邊緣自動捲動：接近頂/底 80px 觸發
    const EDGE = 80;
    if (t.clientY > window.innerHeight - EDGE) {
      autoScrollDir = 1;  // 向下
      startAutoScroll();
    } else if (t.clientY < EDGE) {
      autoScrollDir = -1; // 向上
      startAutoScroll();
    } else {
      autoScrollDir = 0;
      stopAutoScroll();
    }
  };

  const onTouchEnd = (e)=>{
    if (!dragging) return;
    dragging = false;

    stopAutoScroll();

    // 還原定位
    card.style.position = "";
    card.style.left = "";
    card.style.top = "";
    card.style.zIndex = "";

    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;

    // 判斷落點
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const target = el && el.closest(".target");

    if (target && target.dataset.accept === card.dataset.type){
      // 正確的目標框：若已存在卡，先丟回來源池
      if (target.firstChild) moveCardBack(target.firstChild);
      if (card.parentElement && card.parentElement.classList.contains("target")) {
        card.parentElement.classList.remove("filled");
      }
      target.appendChild(card);
      target.classList.add("filled");
    } else {
      // 放回來源池
      if (card.parentElement && card.parentElement.classList.contains("target")) {
        card.parentElement.classList.remove("filled");
      }
      moveCardBack(card);
    }
  };

  // 注意：passive: false 才能在 touchmove 裡 e.preventDefault()，否則無法阻止原生滾動
  card.addEventListener("touchstart", onTouchStart, { passive: true });
  card.addEventListener("touchmove",  onTouchMove,  { passive: false });
  card.addEventListener("touchend",   onTouchEnd);
}

    let dragging = false;
    let offX = 0, offY = 0;

    const onTouchStart = (e)=>{
      const t = e.touches && e.touches[0];
      if (!t) return;
      const rect = card.getBoundingClientRect();
      offX = t.clientX - rect.left;
      offY = t.clientY - rect.top;
      card.style.position = "fixed";
      card.style.zIndex = "9999";
      card.style.left = `${t.clientX - offX}px`;
      card.style.top  = `${t.clientY - offY}px`;
      dragging = true;
    };

    const onTouchMove = (e)=>{
      if (!dragging) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      card.style.left = `${t.clientX - offX}px`;
      card.style.top  = `${t.clientY - offY}px`;
    };

    const onTouchEnd = (e)=>{
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

      if (target && target.dataset.accept === card.dataset.type){
        moveCardToTarget(card, target);
      } else {
        moveCardBack(card);
      }
    };

    card.addEventListener("touchstart", onTouchStart, { passive: true });
    card.addEventListener("touchmove",  onTouchMove,  { passive: true });
    card.addEventListener("touchend",   onTouchEnd);
  }

  // ====== 搬移函式 ======
  function moveCardToTarget(card, target){
    // 若目標已存在卡片，先放回來源池
    if (target.firstChild){
      moveCardBack(target.firstChild);
      target.innerHTML = "";
    }
    // 若卡片原本在另一個 target，把那個 target 樣式清掉
    const parent = card.parentElement;
    if (parent && parent.classList.contains("target")){
      parent.classList.remove("filled");
    }
    // 放入目標
    target.appendChild(card);
    target.classList.add("filled");
  }

  function moveCardBack(card){
    // 回到正確的來源池，且移除原 target 的 filled 樣式
    const parent = card.parentElement;
    if (parent && parent.classList.contains("target")){
      parent.classList.remove("filled");
    }
    if (card.dataset.type === "img") imgPool.appendChild(card);
    else textPool.appendChild(card);
  }

  // ====== 讓目標框與來源池接受「搬移」 ======
  // 目標框：滑鼠 drop
  targets.forEach(t=>{
    t.addEventListener("dragover", (e)=> e.preventDefault());
    t.addEventListener("drop", (e)=>{
      e.preventDefault();
      let data = null;
      try{
        data = JSON.parse(e.dataTransfer.getData("application/json"));
      }catch(_){}
      if (!data) return;
      if (data.type !== t.dataset.accept) return;

      const card = document.querySelector(`[data-uid="${data.uid}"]`);
      if (!card) return;

      moveCardToTarget(card, t);
    });
  });

  // 來源池（把卡片拖回池子）
  [imgPool, textPool].forEach(pool=>{
    pool.addEventListener("dragover", e=> e.preventDefault());
    pool.addEventListener("drop", (e)=>{
      e.preventDefault();
      let data = null;
      try{
        data = JSON.parse(e.dataTransfer.getData("application/json"));
      }catch(_){}
      if (!data) return;
      const card = document.querySelector(`[data-uid="${data.uid}"]`);
      if (!card) return;
      moveCardBack(card);
    });
  });

  // ====== 工具 ======
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  function populatePools(){
    imgPool.innerHTML = "";
    textPool.innerHTML = "";
    // 圖片亂序
    shuffle(images.slice()).forEach(n => imgPool.appendChild(createImgCard(n)));
    // 文字亂序（以 order 為清單來源）
    const textList = Array.isArray(DATA.order) ? DATA.order.slice() : [];
    shuffle(textList).forEach(t => textPool.appendChild(createTextCard(t)));
    texts = textList;
  }

  function collectRows(){
    return [0,1,2].map(i=>{
      const imgCard = document.querySelector(`.target.img[data-slot="${i}"] .card.img`);
      const txtCard = document.querySelector(`.target.text[data-slot="${i}"] .card.text`);
      return {
        img: imgCard ? imgCard.dataset.id : null,
        text: txtCard ? txtCard.dataset.id : null
      };
    });
  }

  function judgeGroups(){
    const rows = collectRows();
    return rows.map((r, i)=>{
      const wantText = (DATA.order || [])[i];
      const filled = !!r.img && !!r.text;
      const pairOK  = filled && (DATA.pairs || {})[r.img] === r.text;
      const orderOK = filled && r.text === wantText;
      return { ok: filled && pairOK && orderOK };
    });
  }

  function doReset(){
    targets.forEach(t=>{ t.innerHTML = ""; t.classList.remove("filled"); });
    populatePools();
  }

  // ====== 送出（顯示對/錯組數） ======
  if (submitBtn){
    submitBtn.addEventListener("click", ()=>{
      const judged = judgeGroups();
      const correct = judged.filter(x=>x.ok).length;
      const wrong = judged.length - correct;
      if (resultSummary) resultSummary.textContent = `✅ 正確 ${correct} 組　❌ 錯誤 ${wrong} 組`;

      overlay.classList.remove("hidden");
      if (correct === judged.length){
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

  // ====== 初始化 ======
  async function init(){
    try{
      const r = await fetch(PROMPT_URL);
      if (!r.ok) throw new Error(`讀取題庫失敗：${PROMPT_URL}`);
      DATA = await r.json();

      // 標題 / 對話 / 教練圖
      if (DATA.title && bigPrompt) bigPrompt.textContent = DATA.title;
      if (DATA.coachText && coachTextEl) coachTextEl.textContent = DATA.coachText;
      if (DATA.coach && coachImage) coachImage.src = IMG_DIR + DATA.coach;

      images = Array.isArray(DATA.images) ? DATA.images.slice() : [];
      populatePools();
    }catch(err){
      console.error(err);
      alert("載入題庫失敗，請確認路徑並用 http(s) 伺服器開啟此頁面");
    }
  }
  init();
})();
