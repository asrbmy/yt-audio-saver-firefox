# YT Audio Saver — Firefox build

Forces YouTube to its lowest video quality (via the player's own methods),
optionally hides the video frame, shows a mini "now playing" widget, keeps a
per-channel full-quality whitelist, and estimates data saved.

## Install (temporary, for testing)
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on…" and pick `manifest.json` from this folder
   (or the zip). It stays until Firefox restarts.
3. If the extension seems inactive on YouTube: `about:addons` → the extension
   → Permissions → allow access to youtube.com (Firefox MV3 treats host
   access as user-grantable).

## Permanent install
Firefox only keeps unsigned add-ons in Developer Edition / Nightly / ESR
(set `xpinstall.signatures.required` to false in about:config), or submit the
zip to addons.mozilla.org for free self-distribution signing.

## Shortcuts
Alt+Shift+Y — toggle audio-first view. Alt+Shift+U — toggle forced low quality.
(Ctrl+Shift+Y is taken by Firefox's Downloads window.) Change under
about:addons → gear icon → Manage Extension Shortcuts.

## Firefox notes
- `navigator.connection` isn't available on Firefox desktop, so network
  auto-detect only works on Firefox for Android; manual toggles work everywhere.
- Needs Firefox 128+.
- It still fetches a (tiny) video stream; for zero video bytes use YouTube Music.
- "Data saved" is an estimate from ballpark bitrates, not measured traffic.
