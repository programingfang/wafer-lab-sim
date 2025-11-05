(function(){
  const grid = document.getElementById('videoGrid');
  const overlay = document.getElementById('playerOverlay');
  const player = document.getElementById('player');
  const closeBtn = document.getElementById('closePlayer');

  const svgOverlaySrc = 'src/img/ic_make.svg';

  function makeCard(item){
    const n = item.n;
    const videoSrc = `src/video/ic_make_${n}.mp4`;
    const pdfSrc = `src/img/image${n}.pdf`;

    const card = document.createElement('div');
    card.className = 'card';
    card.title = item.title || `影片 ${n}`;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';

    const pdfLayer = document.createElement('object');
    pdfLayer.className = 'pdfLayer';
    pdfLayer.setAttribute('data', pdfSrc);
    pdfLayer.setAttribute('type', 'application/pdf');

    const svgOverlay = document.createElement('img');
    svgOverlay.className = 'svgOverlay';
    svgOverlay.alt = 'overlay';
    svgOverlay.src = svgOverlaySrc;

    pdfLayer.onerror = () => {
      thumb.textContent = `預覽無法載入 (image${n}.pdf)`;
    };

    thumb.appendChild(pdfLayer);
    thumb.appendChild(svgOverlay);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = item.title || `影片 ${n}`;

    card.appendChild(thumb);
    card.appendChild(meta);

    card.addEventListener('click', () => {
      playVideo(videoSrc);
    });

    return card;
  }

  function playVideo(src){
    overlay.classList.remove('hidden');
    player.onended = null;
    player.onerror = null;
    player.src = src;
    player.load();
    const p = player.play();
    if (p && typeof p.catch === 'function') { p.catch(()=>{}); }
    player.onended = () => { window.location.href = 'ic_gmae.html'; };
  }

  closeBtn.addEventListener('click', () => {
    player.pause();
    player.removeAttribute('src');
    player.load();
    overlay.classList.add('hidden');
  });

  (window.WAFER_VIDEOS || []).forEach(item => grid.appendChild(makeCard(item)));
})();