// 影片選擇頁：使用 <object> 載 SVG（SVG 內嵌 PDF），點縮圖或標題都會播放；播放後跳 ic_game.html?qid=...
(function(){
  const grid = document.getElementById('videoGrid');
  if(!grid) return;

  // 產生 src/img/ic_make.svg?pdf=image1.pdf
  function svgThumbURL(item){
    const svg = item.svg || 'ic_make.svg';
    const pdf = item.pdf || 'image1.pdf';
    return `src/img/${svg}?pdf=${encodeURIComponent(pdf)}`;
  }

  function playAndGo(item){
    const v = document.createElement('video');
    v.src = `src/video/${item.file || ('ic_make_'+item.n+'.mp4')}`;
    v.controls = true;
    v.autoplay = true;
    v.style.width = '100%';
    v.style.maxHeight = '90vh';

    document.body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.maxWidth = '1100px';
    wrap.style.margin = '24px auto';
    wrap.appendChild(v);
    document.body.appendChild(wrap);

    v.addEventListener('ended', ()=>{
      const qid = item.qid || item.n || 1;
      location.href = `ic_game.html?qid=${qid}`;
    });
  }

  function createCard(item){
    const card = document.createElement('div');
    card.className = 'video-card';

    const thumb = document.createElement('div');
    thumb.className = 'thumb';

    const obj = document.createElement('object');
    obj.type = 'image/svg+xml';
    obj.data = svgThumbURL(item); // 讓 SVG 去載對應 PDF
    thumb.appendChild(obj);

    const title = document.createElement('p');
    title.textContent = item.title || ('影片 ' + (item.n ?? ''));

    const onClick = ()=> playAndGo(item);
    card.onclick = onClick;
    title.onclick = onClick;

    card.appendChild(thumb);
    card.appendChild(title);
    return card;
  }

  const list = Array.isArray(window.WAFER_VIDEOS) ? window.WAFER_VIDEOS : [];
  grid.innerHTML = '';
  if(list.length === 0){
    grid.innerHTML = '<p style="color:#6b7280">尚未設定任何影片</p>';
  }else{
    list.forEach(it=> grid.appendChild(createCard(it)));
  }
})();
