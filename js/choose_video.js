(function(){
  // 等待 DOM 就緒，再開始
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init(){
    const grid = document.getElementById('videoGrid');
    const playerSection = document.getElementById('playerSection');
    const player = document.getElementById('player');
    const backBtn = document.getElementById('backBtn');
    const notice = document.getElementById('notice');

    // 取資料並偵錯
    const list = Array.isArray(window.videoList) ? window.videoList : [];
    if (!Array.isArray(window.videoList)) {
      showNotice("⚠️ 沒找到 <code>video_list.js</code> 或格式不正確。請確認檔案存在且已在此頁以正確路徑載入。");
    } else if (list.length === 0) {
      showNotice("⚠️ <code>video_list.js</code> 目前沒有任何影片資料。請至少加入一筆 { qid, title, src, thumb }。");
    }

    renderGrid(list);

    // 如果有 ?play=<qid>&return=<url> 就自動播放對應項目
    autoplayIfRequested(list);

    // ===== functions =====
    function showNotice(html){
      if (!notice) return;
      notice.classList.add('show');
      notice.innerHTML = html;
    }

    function renderGrid(items){
      grid.innerHTML = '';

      const hasItems = Array.isArray(items) && items.length > 0;
      const data = hasItems ? items : [{
        qid: 0,
        title: "（示意）請先在 js/video_list.js 填入影片資料",
        src: "",
        thumb: "src/img/thumbs/placeholder.png"  // 你可以放一張預備圖；若沒有也不影響顯示
      }];

      data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.qid = item.qid;

        const thumbBox = document.createElement('div');
        thumbBox.className = 'thumb';

        const img = document.createElement('img');
        img.loading = 'lazy';
        img.alt = item.title || `影片 ${item.qid}`;
        img.src = item.thumb || '';
        thumbBox.appendChild(img);

        const title = document.createElement('p');
        title.textContent = item.title || `第 ${item.qid} 題`;

        const playHandler = () => {
          if (!item.src) {
            showNotice("⚠️ 這是示意卡。請在 <code>js/video_list.js</code> 填入正確的 <code>src/thumb</code> 路徑。");
            return;
          }
          playItem(item);
        };

        // 點縮圖或標題都播放；點卡片空白處也播放
        thumbBox.addEventListener('click', playHandler);
        title.addEventListener('click', playHandler);
        card.addEventListener('click', (e) => { if (e.target === card) playHandler(); });

        card.appendChild(thumbBox);
        card.appendChild(title);
        grid.appendChild(card);
      });
    }

    async function playItem(item){
      try{
        // 顯示播放器、設定 poster
        playerSection.style.display = 'block';
        backBtn.style.display = history.length > 1 ? 'inline-block' : 'none';

        if (item.thumb) player.setAttribute('poster', item.thumb);
        else player.removeAttribute('poster');

        // 點擊時才設定 src，避免頁面初載就抓整支影片
        if (player.src !== absolutize(item.src)){
          player.src = item.src;
          player.load(); // 只抓 metadata
        }

        await player.play().catch(()=>{ /* 某些瀏覽器會要求再點播放 */ });

        // 播放完 → 跳到對應關卡
        player.onended = () => {
          const params = new URLSearchParams(location.search);
          const ret = params.get('return');
          if (ret) {
            location.href = ret;
          } else {
            location.href = `ic_game.html?qid=${encodeURIComponent(item.qid)}`;
          }
        };
      }catch(err){
        console.error(err);
        showNotice("❌ 影片播放失敗，請確認 <code>src</code> 路徑或瀏覽器支援。");
        alert('影片播放失敗，請確認檔案路徑或瀏覽器支援度。');
      }
    }

    function autoplayIfRequested(items){
      const params = new URLSearchParams(location.search);
      const qidStr = params.get('play');
      if (!qidStr) return;
      const qid = parseInt(qidStr, 10);
      const item = (items || []).find(x => Number(x.qid) === qid);
      if (item) playItem(item);
      else showNotice(`⚠️ 查無 play=${qid} 的影片項目，請檢查 <code>video_list.js</code>。`);
    }

    function absolutize(url){
      const a = document.createElement('a');
      a.href = url;
      return a.href;
    }

    backBtn?.addEventListener('click', ()=> history.back());
  }
})();
