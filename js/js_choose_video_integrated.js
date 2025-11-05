(function(){
  const grid = document.getElementById('videoGrid');
  const overlay = document.getElementById('playerOverlay');
  const player = document.getElementById('player');
  const closeBtn = document.getElementById('closePlayer');

  const svgOverlaySrc = (window.WAFER_SVG_OVERLAY_SRC || 'src/img/ic_make.svg');

  function makeCard(item){
    const n = item.n;
    const videoSrc = `src/video/ic_make_${n}.mp4`;
    const pdfSrc = `src/img/image${n}.pdf`;

    const card = document.createElement('div');
    card.className = 'card';
    card.title = item.title || `影片 ${n}`;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';

    const iframe = document.createElement('iframe');
    iframe.src = pdfSrc + '#page=1&zoom=page-fit';
    iframe.loading = 'lazy';

    const svgOverlay = document.createElement('img');
    svgOverlay.className = 'svgOverlay';
    svgOverlay.alt = 'overlay';
    svgOverlay.src = svgOverlaySrc;

    thumb.appendChild(iframe);
    thumb.appendChild(svgOverlay);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = item.title || `影片 ${n}`;

    card.appendChild(thumb);
    card.appendChild(meta);

    card.addEventListener('click', () => {
      playVideo(videoSrc, n);
    });

    return card;
  }

  function playVideo(src, qid){
    overlay.classList.remove('hidden');
    player.onended = null;
    player.onerror = null;
    player.src = src;
    player.load();
    const p = player.play();
    if (p && typeof p.catch === 'function') { p.catch(()=>{}); }
    player.onended = () => {
      window.location.href = `ic_gmae.html?qid=${qid}`;
    };
  }

  closeBtn.addEventListener('click', () => {
    player.pause();
    player.removeAttribute('src');
    player.load();
    overlay.classList.add('hidden');
  });

  (window.WAFER_VIDEOS || []).forEach(item => grid.appendChild(makeCard(item)));
})();