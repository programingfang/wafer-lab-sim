// 影片選擇頁：支援「1 個 SVG + 多個 PDF」作為縮圖。
// 需求：你的 SVG 內部腳本可讀取 window.location 或 document.currentScript/data 的查詢參數 ?pdf=imageX.pdf
// 然後自行把對應的 PDF 畫面嵌入顯示。

(function(){
  const grid = document.getElementById("videoGrid");
  if (!grid) return;

  function svgThumbPath(item) {
    // 組合 src/img/ic_make.svg?pdf=image1.pdf
    const svg = item.svg || "ic_make.svg";
    const pdf = item.pdf || "image1.pdf";
    return `src/img/${svg}?pdf=${encodeURIComponent(pdf)}`;
  }

  function createCard(item){
    const div = document.createElement("div");
    div.className = "video-card";

    // 用 <object> 載入 SVG，並帶上 ?pdf= 參數
    const obj = document.createElement("object");
    obj.type = "image/svg+xml";
    obj.data = svgThumbPath(item);
    obj.style.width = "100%";
    obj.style.height = "180px";
    obj.style.borderRadius = "12px";
    obj.style.overflow = "hidden";

    // 標題
    const p = document.createElement("p");
    p.textContent = item.title || ("影片 " + (item.n ?? ""));
    p.style.margin = "10px 6px 4px";
    p.style.fontWeight = "700";
    p.style.color = "#374151";

    div.appendChild(obj);
    div.appendChild(p);
    div.onclick = () => playAndGo(item);
    return div;
  }

  function playAndGo(item){
    const v = document.createElement("video");
    v.src = "src/video/" + (item.file || ("ic_make_"+item.n+".mp4"));
    v.controls = true; v.autoplay = true; v.style.width = "100%"; v.style.maxHeight = "90vh";
    document.body.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.style.maxWidth = "1100px"; wrap.style.margin = "24px auto";
    wrap.appendChild(v);
    document.body.appendChild(wrap);
    v.addEventListener("ended", ()=> location.href = "ic_game.html?qid=" + (item.qid || item.n || 1));
  }

  const list = Array.isArray(window.WAFER_VIDEOS) ? window.WAFER_VIDEOS : [];
  if (list.length === 0) {
    grid.innerHTML = `<p style="color:#6b7280">尚未設定任何影片</p>`;
  } else {
    list.forEach(it => grid.appendChild(createCard(it)));
  }
})();
