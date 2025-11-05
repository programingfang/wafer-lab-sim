/* 關卡頁：載入題目與答案（qid），支援拖放、細分配分（順序 0.5 + 配對 0.5） */
(function () {
  // 取得專案根（支援 GitHub Pages 子路徑）
  const seg = window.location.pathname.split("/").filter(Boolean);
  const BASE = seg.length > 0 ? ("/" + seg[0] + "/") : "/";

  // 取得 qid
  const params = new URLSearchParams(location.search);
  const QID = (() => {
    const q = parseInt(params.get("qid") || "1", 10);
    return Number.isFinite(q) && q > 0 ? q : 1;
  })();

  // 路徑
  const IMG_DIR    = BASE + "src/game/img/";
  const TEXT_URL   = BASE + `src/game/text/q${QID}_text.json`;   // ["設計","製造","封測"]
  const ANSWER_URL = BASE + `src/game/answer/q${QID}_answer.json`; // { order:[...], pairs:{ "1-1.jpg":"設計", ... } }
  const TITLE_URL  = BASE + `src/game/text/q${QID}_title.json`;  // { "title":"..." } 或直接字串

  // 預設 3 張圖片（你也可以依需要改成從 JSON 載入）
  let images = [`${QID}-1.jpg`, `${QID}-2.jpg`, `${QID}-3.jpg`];
  let texts = [];
  let answer = null;

  // 元素
  const bigPrompt = document.getElementById("bigPrompt");
  const imgPool = document.getElementById("imgPool");
  const textPool = document.getElementById("textPool");
  const targets = Array.from(document.querySelectorAll(".target"));

  const submitBtn = document.getElementById("submitBtn");
  const resetBtn = document.getElementById("resetBtn");

  const overlay = document.getElementById("resultOverlay");
  const resultText = document.getElementById("resultText");
  const breakdown = document.getElementById("breakdown");
  const backBtn = document.getElementById("backBtn");
  const continueBtn = document.getElementById("continueBtn");

  // 小工具
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 卡片
  function createImgCard(name) {
    const d = document.createElement("div");
    d.className = "card img";
    d.draggable = true;
    d.dataset.type = "img";
    d.dataset.id = name;

    const img = document.createElement("img");
    img.src = IMG_DIR + name;
    img.alt = name;
    img.onerror = () => console.warn("圖片載入失敗：", img.src);

    d.appendChild(img);

    d.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({ type: "img", id: name })
      );
    });
    return d;
  }

  function createTextCard(text) {
    const d = document.createElement("div");
    d.className = "card text";
    d.draggable = true;
    d.dataset.type = "text";
    d.dataset.id = text;
    d.textContent = text;

    d.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({ type: "text", id: text })
      );
    });
    return d;
  }

  // 目標格（接收拖放）
  targets.forEach((t) => {
    t.addEventListener("dragover", (e) => e.preventDefault());
    t.addEventListener("drop", (e) => {
      e.preventDefault();
      let data;
      try {
        data = JSON.parse(e.dataTransfer.getData("text/plain"));
      } catch (err) {
        return;
      }
      if (!data || data.type !== t.dataset.accept) return;
      // 若該格已有舊卡，先送回池
      if (t.firstChild) {
        sendBack(t.firstChild);
        t.innerHTML = "";
      }
      const card =
        data.type === "img" ? createImgCard(data.id) : createTextCard(data.id);
      t.classList.add("filled");
      t.innerHTML = "";
      t.appendChild(card);
    });
  });

  function sendBack(card) {
    if (card.classList.contains("img")) {
      imgPool.appendChild(createImgCard(card.dataset.id));
    } else {
      textPool.appendChild(createTextCard(card.dataset.id));
    }
  }

  // 填充左右兩區
  function populatePools() {
    imgPool.innerHTML = "";
    textPool.innerHTML = "";
    shuffle(images.slice()).forEach((n) => imgPool.appendChild(createImgCard(n)));
    shuffle(texts.slice()).forEach((t) => textPool.appendChild(createTextCard(t)));
  }

  // 收集作答
  function collectAnswer() {
    return [0, 1, 2].map((i) => {
      const imgBox = document.querySelector(
        `.target.img[data-slot="${i}"] .card`
      );
      const txtBox = document.querySelector(
        `.target.text[data-slot="${i}"] .card`
      );
      return {
        img: imgBox ? imgBox.dataset.id : null,
        text: txtBox ? txtBox.dataset.id : null,
      };
    });
  }

  // 細分配分：順序正確 0.5 + 圖文配對 0.5
  function scoreAnswerDetailed() {
    const rows = collectAnswer();
    let total = 0;
    const detail = [];

    for (let i = 0; i < 3; i++) {
      const wantText = (answer.order || [])[i];
      const row = rows[i];
      let s = 0;

      if (row.img && row.text) {
        const orderOK = row.text === wantText;
        const pairOK = (answer.pairs || {})[row.img] === row.text;
        if (orderOK) s += 0.5;
        if (pairOK) s += 0.5;
        detail.push({ i, orderOK, pairOK, score: s });
      } else {
        detail.push({ i, orderOK: false, pairOK: false, score: 0 });
      }
      total += s;
    }
    const percent = Math.round((total / 3) * 100);
    return { percent, detail };
  }

  function showBreakdown(detail) {
    if (!breakdown) return;
    breakdown.innerHTML = detail
      .map((d) => {
        const idx = d.i + 1;
        const order = d.orderOK ? "✔順序" : "✖順序";
        const pair = d.pairOK ? "✔配對" : "✖配對";
        const cls = d.score === 1 ? "ok" : d.score === 0.5 ? "half" : "bad";
        return `<div class="${cls}">第${idx}格：${order}、${pair}（${d.score.toFixed(
          1
        )}）</div>`;
      })
      .join("");
  }

  // 事件
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      if (!answer) return;
      const { percent, detail } = scoreAnswerDetailed();
      if (resultText) resultText.textContent = `已達正確 ${percent}%`;
      showBreakdown(detail);
      if (overlay) overlay.classList.remove("hidden");
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      targets.forEach((t) => {
        t.innerHTML = "";
        t.classList.remove("filled");
      });
      populatePools();
      if (overlay) overlay.classList.add("hidden");
    });
  }

  if (backBtn) backBtn.addEventListener("click", () => (location.href = "choose_video.html"));
  if (continueBtn) continueBtn.addEventListener("click", () => overlay && overlay.classList.add("hidden"));

  // 初始化：載入題目 / 答案
  async function init() {
    try {
      // 題目標題
      const tp = await fetch(TITLE_URL);
      if (tp.ok) {
        const tjson = await tp.json();
        const titleText = typeof tjson === "string" ? tjson : tjson.title || "";
        if (titleText && bigPrompt) bigPrompt.textContent = titleText;
      }

      // 文字選項
      const tRes = await fetch(TEXT_URL);
      if (!tRes.ok) throw new Error(`讀取文字失敗：${TEXT_URL}（HTTP ${tRes.status}）`);
      texts = await tRes.json();

      // 答案
      const aRes = await fetch(ANSWER_URL);
      if (!aRes.ok) throw new Error(`讀取答案失敗：${ANSWER_URL}（HTTP ${aRes.status}）`);
      answer = await aRes.json();

    } catch (err) {
      console.error(err);
      alert("讀取題目/答案失敗，請檢查路徑與是否透過 http(s) 伺服器開啟。");
      return;
    }
    populatePools();
  }

  init();
})();
