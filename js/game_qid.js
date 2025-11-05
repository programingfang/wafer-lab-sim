/* 關卡頁（整合題庫版）
 * 讀取 src/game/text/q{qid}_prompt.json：
 * {
 *   title, coachText, video,
 *   images: [...], order: [...], pairs: {img:text},
 *   coach, figure
 * }
 * 規則：同欄「圖片+文字」要同時正確且順序正確，三欄全對才過關
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
  const bigPrompt = document.getElementById("bigPrompt");
  const imgPool = document.getElementById("imgPool");
  const textPool = document.getElementById("textPool");
  const targets = Array.from(document.querySelectorAll(".target"));
  const submitBtn = document.getElementById("submitBtn");
  const resetBtn = document.getElementById("resetBtn");
  const overlay = document.getElementById("resultOverlay");
  const resultText = document.getElementById("resultText");
  const leftBtn = document.getElementById("leftActionBtn");
  const rightBtn = document.getElementById("rightActionBtn");
  const coachText = document.getElementById("coachText");
  const coachAvatar = document.getElementById("coachAvatar");
  const rightFigure = document.getElementById("rightFigure");

  // 題庫資料
  let DATA = null;          // 整個 q{qid}_prompt.json
  let images = [];          // 例：["1-1.jpg","1-2.jpg","1-3.jpg"]
  let texts = [];           // 例：["設計","製造","封測"]

  // 工具
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a;}

  function createImgCard(name){
    const d = document.createElement("div");
    d.className = "card img"; d.draggable = true;
    d.dataset.type = "img"; d.dataset.id = name;
    const img = document.createElement("img");
    img.src = IMG_DIR + name; img.alt = name;
    d.appendChild(img);
    d.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", JSON.stringify({type:"img",id:name}));
    });
    return d;
  }
  function createTextCard(text){
    const d = document.createElement("div");
    d.className = "card text"; d.draggable = true;
    d.dataset.type = "text"; d.dataset.id = text;
    d.textContent = text;
    d.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", JSON.stringify({type:"text",id:text}));
    });
    return d;
  }
  function sendBack(card){
    if (card.classList.contains("img")) imgPool.appendChild(createImgCard(card.dataset.id));
    else textPool.appendChild(createTextCard(card.dataset.id));
  }

  // 目標區拖放
  targets.forEach(t=>{
    t.addEventListener("dragover", e=> e.preventDefault());
    t.addEventListener("drop", e=>{
      e.preventDefault();
      let data; try{ data = JSON.parse(e.dataTransfer.getData("text/plain")); }catch{ return; }
      if (!data || data.type !== t.dataset.accept) return;
      if (t.firstChild){ sendBack(t.firstChild); t.innerHTML=""; }
      const card = data.type==="img"? createImgCard(data.id): createTextCard(data.id);
      t.classList.add("filled"); t.innerHTML=""; t.appendChild(card);
    });
  });

  function populatePools(){
    imgPool.innerHTML=""; textPool.innerHTML="";
    shuffle(images.slice()).forEach(n=> imgPool.appendChild(createImgCard(n)));
    // 文本從 order 推出（確保與題庫一致）
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

  // 規則：同欄配對 + 文字在正確欄位
  function isAllCorrect(){
    if (!DATA) return false;
    const rows = collectRows();
    if (rows.some(r=>!r.img || !r.text)) return false;
    for (let i=0;i<3;i++){
      const wantText = (DATA.order || [])[i];
      const row = rows[i];
      const pairOK = (DATA.pairs || {})[row.img] === row.text;
      const orderOK = row.text === wantText;
      if (!(pairOK && orderOK)) return false;
    }
    return true;
  }

  function doReset(){
    targets.forEach(t=>{ t.innerHTML=""; t.classList.remove("filled"); });
    populatePools();
  }

  // 送出
  if (submitBtn){
    submitBtn.addEventListener("click", ()=>{
      const ok = isAllCorrect();
      overlay.classList.remove("hidden");
      if (ok){
        resultText.textContent = "結果：對";
        leftBtn.textContent = "恭喜過關!";
        rightBtn.textContent = "再玩一次";
        leftBtn.onclick = ()=> location.href = "index.html";
        rightBtn.onclick = ()=> location.href = "choose_video.html";
      }else{
        resultText.textContent = "結果：錯";
        leftBtn.textContent = "重看影片";
        rightBtn.textContent = "再試一次";

        // 回影片：播放完返回本題
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

  // 初始化：讀整合題庫
  async function init(){
    try{
      const r = await fetch(PROMPT_URL);
      if (!r.ok) throw new Error(`讀取題庫失敗：${PROMPT_URL}`);
      DATA = await r.json();

      // 大標題
      if (DATA.title && bigPrompt) bigPrompt.textContent = DATA.title;

      // 左下說話框
      if (DATA.coachText) coachText.textContent = DATA.coachText;

      // 角色圖
      if (DATA.coach) coachAvatar.src = IMG_DIR + DATA.coach;
      if (DATA.figure) rightFigure.src = IMG_DIR + DATA.figure;

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
