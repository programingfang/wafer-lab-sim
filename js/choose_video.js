(function(){
  const grid = document.getElementById('videoGrid');
  const playerSection = document.getElementById('playerSection');
  const player = document.getElementById('player');
  const backBtn = document.getElementById('backBtn');

  // 安全取得 videoList
  const list = Array.isArray(window.videoList) ? window.videoList : [];

  // 建立卡片：縮圖先顯示，點擊後才設定 player.src
  function renderGrid(){
    grid.innerHTML = '';
    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.dataset.qid = item.qid;

      const thumbBox = document.createElement('div');
      thumbBox.className = 'thumb';

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = item.title || `影片 ${item.qid}`;
      img.src = item.thumb;            // 小圖（PNG/JPG）放這裡
      thumbBox.appendChild(img);

      const title = document.createElement('p');
      title.textContent = item.title || `第 ${item.qid} 題`;

      // 點縮圖或標題都播放
      thumbBox.addEventListener('click', () => playItem(item));
      title.addEventListener('click', () => playItem(item));
      card.addEventListener('click', (e) => {
        // 若是點擊卡片空白處也能播放
        if (e.target === card) playItem(item);
      });

      card.appendChild(thumbBox);
      card.appendChild(title);
      grid.appendChild(card);
    });

    // Optional: 進一步 lazy-load 縮圖（視覺上通常 loading="lazy" 已足夠）
    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver(entries=>{
        entries.forEach(en=>{
          if (en.isIntersecting){
            const pic = en.target.querySelector('img');
            if (pic && pic.dataset.src){
              pic.src = pic.dataset.src;
              delete pic.dataset.src;
            }
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '200px' });

      Array.from(document.querySelectorAll('.video-card')).forEach(c => io.observe(c));
    }
  }

  // 真正開始播放：點擊時才設定 src，並顯示播放器
  async function playItem(item){
    try{
      // 顯示播放器、設定 poster
      playerSection.style.display = 'block';
      backBtn.style.display = history.length > 1 ? 'inline-block' : 'none';

      // 設 poster（避免一片黑）
      if (item.thumb) player.setAttribute('poster', item.thumb);
      else player.removeAttribute('poster');

      // 僅在點擊時設定 src，避免一載入頁面就拉整支影片
      if (player.src !== absolutize(item.src)){
        player.src = item.src;  // 讓瀏覽器自己解析相對路徑即可
        player.load();          // 只抓 metadata
      }

      // 嘗試播放（使用者互動後通常允許自動播放含聲）
      await player.play().catch(()=>{ /* 某些瀏覽器會要求再點擊一次播放 */ });

      // 播放完畢 → 轉到對應關卡
      player.onended = () => {
        // 若 URL 有 return 參數：看完回來要去哪
        const params = new URLSearchParams(location.search);
        const ret = params.get('return');
        if (ret) {
          location.href = ret;
        } else {
          // 預設：跳到對應的關卡頁
          location.href = `ic_game.html?qid=${encodeURIComponent(item.qid)}`;
        }
      };
    }catch(err){
      console.error(err);
      alert('影片播放失敗，請確認檔案路徑或瀏覽器支援度。');
    }
  }

  // 支援從外部指定 ?play=<qid>&return=<url> 直接播放並返回
  function autoplayIfRequested(){
    const params = new URLSearchParams(location.search);
    const qidStr = params.get('play');
    if (!qidStr) return;
    const qid = parseInt(qidStr, 10);
    const item = list.find(x => Number(x.qid) === qid);
    if (item) playItem(item);
  }

  // 讓相對路徑比較/判斷時能拿到絕對字串（必要時）
  function absolutize(url){
    const a = document.createElement('a');
    a.href = url;
    return a.href;
  }

  // 返回按鈕（若出現）
  backBtn?.addEventListener('click', ()=> history.back());

  // 初始化：渲染卡片 → 檢查是否要自動播放
  renderGrid();
  autoplayIfRequested();
})();
