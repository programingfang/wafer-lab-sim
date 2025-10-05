const steps = [
  "晶圓清洗",
  "熱氧化",
  "光阻塗佈",
  "曝光與顯影",
  "蝕刻",
  "去光阻",
  "雜質擴散",
  "金屬化"
];

// 正確順序（可依需求調整）
const correctOrder = [...steps];

window.addEventListener("DOMContentLoaded", () => {
  const pool = document.getElementById("step-pool");
  // 產生步驟卡
  shuffle([...steps]).forEach(step => {
    const card = createCard(step);
    pool.appendChild(card);
  });
});

function createCard(text) {
  const card = document.createElement("div");
  card.className = "step-card";
  card.draggable = true;
  card.textContent = text;
  card.setAttribute("data-step", text);

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", text);
    // 拖曳時給一個小徽章提示
    const ghost = card.cloneNode(true);
    ghost.classList.add("badge");
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    setTimeout(() => document.body.removeChild(ghost), 0);
  });
  return card;
}

function dropToFlow(event) {
  event.preventDefault();
  const step = event.dataTransfer.getData("text/plain");
  const flowArea = document.getElementById("flow-area");
  const placeholder = flowArea.querySelector(".placeholder");
  if (placeholder) placeholder.remove();

  // 防止重複加入
  const exists = Array.from(flowArea.querySelectorAll(".step-card"))
    .some(c => c.getAttribute("data-step") === step);
  if (exists) {
    alert("此步驟已加入排列區！");
    return;
  }

  const card = createCard(step);
  flowArea.appendChild(card);
}

function submitFlow() {
  const flowArea = document.getElementById("flow-area");
  const placed = Array.from(flowArea.querySelectorAll(".step-card"))
    .map(c => c.getAttribute("data-step"));

  console.log("提交順序：", placed); // 供除錯

  const result = document.getElementById("result");

  if (placed.length !== correctOrder.length) {
    result.textContent = "❌ 步驟數量不正確，請完成所有步驟再提交。";
    result.style.color = "#b91c1c";
    return;
  }

  const pass = placed.every((s, i) => s === correctOrder[i]);
  if (pass) {
    result.textContent = "✅ 恭喜，製程順序正確！";
    result.style.color = "#065f46";
  } else {
    result.textContent = "❌ 製程順序錯誤，請再試一次。";
    result.style.color = "#b91c1c";
  }
}

function resetFlow() {
  const pool = document.getElementById("step-pool");
  const flowArea = document.getElementById("flow-area");
  const result = document.getElementById("result");

  pool.innerHTML = "";
  flowArea.innerHTML = '<div class="placeholder">把步驟卡片拖曳到這裡 →</div>';
  result.textContent = "";

  // 重新洗牌生成
  shuffle([...steps]).forEach(step => {
    pool.appendChild(createCard(step));
  });
}

function shuffle(arr) {
  // 簡單洗牌
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
