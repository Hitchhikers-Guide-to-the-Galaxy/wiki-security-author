// wiki-security-author client — lock state + an unmissable-but-subtle visual
// cue that you are on the LOCAL MIRROR, not the live public site.
//
// This file is served only by farms running wiki-security-author (the mirror),
// so the cue appears on every mirror wiki and never on live sites — the
// distinction that matters when /etc/hosts is diverting real domain names.
//
// window.isLocalMirror is the machine-readable form of the same fact: set at
// script load (before plugins bind), it lets local-first plugins (terminal,
// termflow) offer their live behaviour on mirror-served public domains, where
// the hostname alone says nothing about being local. Live sites never load
// this file, so the flag can never appear there.
window.isLocalMirror = true

window.plugins.security = {
  setup: function () {
    var icon = window.isOwner ? "✍️" : "🔒"
    var title = window.isOwner
      ? "Local author - your edits carry provenance"
      : "Read-only here - not your site"
    $('footer > #security').html(
      "<span class='footer-item' title='" + title + "'>" + icon + "</span>")

    if (!document.getElementById('local-mirror-cue')) {
      var style = document.createElement('style')
      style.id = 'local-mirror-cue'
      style.textContent = [
        // warm parchment wash behind the pages — visible in the margins
        'body { background-color: #f7f0e0 !important; }',
        // amber stripe across the very top of the window
        'body::before { content: ""; position: fixed; top: 0; left: 0; right: 0;',
        '  height: 4px; background: #c4561d; z-index: 9999; pointer-events: none; }',
        // small standing badge, bottom-left, out of the way of the factory drop zone
        '#local-mirror-badge { position: fixed; bottom: 6px; left: 8px; z-index: 9999;',
        '  font: 11px -apple-system, Helvetica, sans-serif; color: #8a5a1d;',
        '  background: #f7f0e0; border: 1px solid #d9c79a; border-radius: 10px;',
        '  padding: 2px 9px; opacity: .85; pointer-events: none; }',
      ].join('\n')
      document.head.appendChild(style)
      var badge = document.createElement('div')
      badge.id = 'local-mirror-badge'
      badge.textContent = (window.isOwner ? '✍️ ' : '🔒 ') + 'local mirror'
      document.body.appendChild(badge)
    }
  },
}
