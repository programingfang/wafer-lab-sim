// choose_video.js
// - 使用 PNG 縮圖 (thumb)
// - 點縮圖或標題皆可播放
// - 播完自動前往 ic_game.html?qid=...
// - 支援 auto-play：choose_video.html?play=<qid>&return=<encodedURL>

(function () {
  const grid = document.getElementById("videoGrid");
  if (!grid) return;

  // 如需支援 GitHub Pages 子路徑，改為 true
  const USE_BASE = false;
  const BASE = (() => {
    if (!USE_BASE) return "";
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.length ? `/${parts[0]}/` : "/";
  })();

  function thumbURL(item) {
    const fn = item.thumb || `ic_make_${item.n}.png`;
    return `${BASE}src/img/${fn}`;
  }
  function videoURL(item) {
    const fn = item.file || `ic_make_${item.n}.mp4`;
    return `${BASE}src/video/${fn}`;
  }
  function gameURL(qid) {
    return `${BASE}ic_game.html?qid=${qid}`;
  }

  function playInline(item, onEndedGoTo) {
    const v = document.createElement("video");
    v.src = videoURL(item);
    v.controls = true;
    v.autoplay = true;
    v.style.width = "100%";
    v.style.maxHeight = "90vh";

    document.body.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.style.maxWidth = "1100px";
    wrap.style.margin = "24px auto";
    wrap.appendChild(v);
    document.body.appendChild(wrap);

    v.addEventListener("ended", () => {
      if (typeof onEndedGoTo === "string" && onEndedGoTo.length) {
        location.href = onEndedGoTo;
      } else {
        const qid = item.qid || item.n || 1;
        location.href = gameURL(qid);
      }
    });
  }

  function createCard(item) {
    const card = document.createElement("div");
    card.className = "video-card";

    // 縮圖容器（16:9）
    const thumb = document.createElement("div");
    thumb.className = "thumb";

    const img = document.createElement("img");
    img.src = thumbURL(item);
    img.alt = item.title || `影片 ${item.n}`;
    img.loading = "lazy";
    thumb.appendChild(img);

    const p = document.createElement("p");
    p.textContent = item.title || `影片 ${item.n}`;
    p.style.cursor = "pointer";

    const onClick = () => playInline(item);
    card.onclick = onClick;
    thumb.onclick = onClick;
    p.onclick = onClick;

    card.appendChild(thumb);
    card.appendChild(p);
    return card;
  }

  // 渲染清單
  const list = Array.isArray(window.WAFER_VIDEOS) ? window.WAFER_VIDEOS : [];
  grid.innerHTML = "";
  if (list.length === 0) {
    grid.innerHTML = `<p style="color:#6b7280">尚未設定任何影片</p>`;
  } else {
    list.forEach((it) => grid.appendChild(createCard(it)));
  }

  // === 自動播放：?play=<qid>&return=<encodedURL> ===
  (function autoPlayIfNeeded() {
    const usp = new URLSearchParams(location.search);
    const playQ = parseInt(usp.get("play") || "", 10);
    const ret = usp.get("return"); // 可能是 encoded URL
    if (!playQ) return;

    const item = list.find((v) => (v.qid || v.n) === playQ);
    if (!item) return;

    // 若有 return 參數，優先導回該 URL；否則回本題 ic_game
    const backTo = ret ? decodeURIComponent(ret) : gameURL(playQ);
    playInline(item, backTo);
  })();
})();
