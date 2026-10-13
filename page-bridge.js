// Runs in the PAGE's JS world (injected by content.js) so it can call the
// methods YouTube attaches to #movie_player. Talks to content.js via postMessage.
(() => {
  if (window.__yasBridge) return;
  window.__yasBridge = true;

  const getPlayer = () => document.getElementById('movie_player');
  let wantLow = null;
  let lastKey = null;

  function applyQuality(p, force) {
    if (wantLow === null) return;
    let videoId = '';
    try { videoId = (p.getVideoData() || {}).video_id || ''; } catch (e) {}
    const key = videoId + '|' + wantLow;
    try {
      if (wantLow) {
        // Re-apply if video/setting changed, or YouTube bumped quality back up.
        const q = p.getPlaybackQuality ? p.getPlaybackQuality() : null;
        if (force || key !== lastKey || (q && q !== 'tiny')) {
          if (p.setPlaybackQualityRange) p.setPlaybackQualityRange('tiny', 'tiny');
          if (p.setPlaybackQuality) p.setPlaybackQuality('tiny');
        }
      } else if (force || key !== lastKey) {
        if (p.setPlaybackQualityRange) p.setPlaybackQualityRange('tiny', 'highres');
        if (p.setPlaybackQuality) p.setPlaybackQuality('auto');
      }
      lastKey = key;
    } catch (e) { /* player may be mid-navigation */ }
  }

  function postInfo() {
    const p = getPlayer();
    if (!p) return;
    try {
      const d = p.getVideoData ? p.getVideoData() : null;
      if (!d || !d.video_id) return;
      window.postMessage({
        source: 'yas-page',
        info: {
          video_id: d.video_id,
          title: d.title || '',
          author: d.author || '',
          state: p.getPlayerState ? p.getPlayerState() : -1,
          quality: p.getPlaybackQuality ? p.getPlaybackQuality() : ''
        }
      }, window.location.origin);
    } catch (e) {}
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || e.data.source !== 'yas-content') return;
    const p = getPlayer();
    switch (e.data.type) {
      case 'quality':
        wantLow = !!e.data.low;
        if (p) applyQuality(p, false);
        break;
      case 'playpause':
        try { if (p) (p.getPlayerState() === 1 ? p.pauseVideo() : p.playVideo()); } catch (err) {}
        break;
      case 'next':
        try { if (p && p.nextVideo) p.nextVideo(); } catch (err) {}
        break;
      case 'prev':
        try { if (p && p.previousVideo) p.previousVideo(); } catch (err) {}
        break;
      case 'poll':
        postInfo();
        break;
    }
  });

  setInterval(() => {
    postInfo();
    const p = getPlayer();
    if (p) applyQuality(p, false);
  }, 2000);

  document.addEventListener('yt-navigate-finish', () => {
    postInfo();
    const p = getPlayer();
    if (p) applyQuality(p, true);
  });
})();
