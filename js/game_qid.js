(function () {
  const params = new URLSearchParams(location.search);
  const QID = parseInt(params.get("qid") || "1", 10);
  const IMG_DIR = "src/game/img/";
  const PROMPT_URL = `src/game/text/q${QID}_prompt.json`;

  const imgPool = document.getElementById("imgPool");
  const textPool = document.getElementById("textPool");
  const targets = document.querySelectorAll(".target");
  const submitBtn = document.getElementById("submitBtn");
  const resetBtn = document.getElementById("resetBtn");
  const overlay = document.getElementById("resultOverlay");
  const resultText = document.getElementById("resultText");
  const resultSummary = document.getElementById("resultSummary");
  const leftBtn = document.getElementById("leftActionBtn");
  const rightBtn = document.getElementById("rightActionBtn");
  const coachTextEl = document.getElementById("coachText");
  const coachImage = document.getElementById("coachImage");
  const bigPrompt = document.getElementById("bigPrompt");

  let DATA = null;

  // ========= 拖曳 + 觸控支援 =========
  function enableTouchDrag(el) {
    let offsetX = 0, offsetY = 0;
    let dragging = false;

    el.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      const rect = el.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
      el.style.position = "fixed";
      el.style.zIndex = "1000";
      dragging = true;
    });

    el.addEventListener("touchmove", (e) => {
      if (!dragging) return;
      const touch = e.touches[0];
      el.style.left = `${touch.clientX - offsetX}px`;
      el.style.top = `${touch.clientY - offsetY}px`;
    });

    el.addEventListener("touchend", (e) => {
      if (!dragging) return;
      dragging = false;
      const touch = e.changedTouches[0];
      const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      const target = dropTarget && dropTarget.closest(".target");

      el.style.position = "";
      el.style.left = "";
      el.style.top = "";
      el.style.zIndex = "";

      if (target && target.dataset.accept === el.dataset.type) {
        target.innerHTML = "";
        target.appendChild(el);
      } else {
        if (el.dataset.type === "img") imgPool.appendChild(el);
        else textPool.appendChild(el);
      }
    });
  }

  function createCard(type, content) {
    const d = document.createElement("div");
    d.className = "card " + type;
    d.dataset.type = type;
    d.draggable = true;
    if (type === "img") {
      const img = document.createElement("img");
      img.src = IMG_DIR + content;
      d.appendChild(img);
    } else d.textContent = content;

    d.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", JSON.stringify({ type, content }));
    });
    enableTouchDrag(d);
    return d;
  }

  targets.forEach(t => {
    t.addEventListener("dragover", e => e.preventDefault());
    t.addEventListener("drop", (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.type !== t.dataset.accept) return;
      const el = createCard(data.type, data.content);
      t.innerHTML = "";
      t.appendChild(el);
    });
  });

  // ===== 判定邏輯 =====
  function collectRows() {
    return [0,1,2].map(i => {
      const img = document.querySelector(`.target.img[data-slot="${i}"] img`);
      const txt = document.querySelector(`.target.text[data-slot="${i}"] .card`);
      return { img: img ? img.src.split("/").pop() : null, text: txt ? txt.textContent : null };
    });
  }

  function judgeGroups() {
    const rows = collectRows();
    return rows.map((r, i) => {
      const wantText = DATA.order[i];
      const correctPair = DATA.pairs[r.img] === r.text;
      const correctOrder = r.text === wantText;
      return { ok: correctPair && correctOrder };
    });
  }

  // ===== 重設 =====
  function doReset() {
    targets.forEach(t => t.innerHTML = "");
    populatePools();
  }

  // ===== 送出 =====
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const judged = judgeGroups();
      const correct = judged.filter(g => g.ok).length;
      const wrong = judged.length - correct;
      resultSummary.textContent = `✅ 正確 ${correct} 組　❌ 錯誤 ${wrong} 組`;
      const allOK = correct === judged.length;

      overlay.classList.remove("hidden");
      if (allOK) {
        resultText.textContent = "結果：對";
        leftBtn.textContent = "恭喜過關!";
        rightBtn.textContent = "再玩一次";
        leftBtn.onclick = () => location.href = "index.html";
        rightBtn.onclick = () => location.href = "choose_video.html";
      } else {
        resultText.textContent = "結果：錯";
        leftBtn.textContent = "重看影片";
        rightBtn.textContent = "再試一次";
        leftBtn.onclick = () => location.href = `choose_video.html?play=${QID}`;
        rightBtn.onclick = () => { overlay.classList.add("hidden"); doReset(); };
      }
    });
  }
  if (resetBtn) resetBtn.addEventListener("click", doReset);

  // ===== 載入題庫 =====
  async function init() {
    const r = await fetch(PROMPT_URL);
    DATA = await r.json();
    if (bigPrompt) bigPrompt.textContent = DATA.title || "";
    if (coachTextEl) coachTextEl.textContent = DATA.coachText || "";
    if (coachImage && DATA.coach) coachImage.src = IMG_DIR + DATA.coach;
    populatePools();
  }

  function populatePools() {
    imgPool.innerHTML = "";
    textPool.innerHTML = "";
    (DATA.images || []).forEach(n => imgPool.appendChild(createCard("img", n)));
    (DATA.order || []).forEach(t => textPool.appendChild(createCard("text", t)));
  }

  init();
})();
