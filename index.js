// wiki-security-author — per-site authorization for a LOCAL mirror farm.
//
// Who you are comes from a local identity file (the machine is the login):
//
//   ~/.wiki/local-author.json
//   {
//     "name":  "David Bovill",     // provenance display name
//     "id":    "david",            // matched against owner.json oauth2.id/username
//     "admin": true,               // optional: edit every site, wiki admin
//     "sites": ["david.*"]         // optional: extra editable-site globs
//   }
//
// Authorization per site: editable when identity.admin, when the site's
// owner.json oauth2 id/username equals identity.id, or when the domain
// matches one of identity.sites. Everything else is readable, not writable.
// Unclaimed sites (no owner.json) are editable — fork-and-claim still works.
//
// Provenance: every journal action saved through this server is stamped with
//   "author": {"name": ..., "id": ...}
// — an additive field that travels with the page through sync and forks.
//
// This module is the strangler seam for future p2p / trust-graph security
// (Proof of Understanding, human.tech): replace the identity file with key
// material and these two functions with attestation checks; nothing else in
// the wiki needs to change.
//
// LOCAL USE ONLY: identity is asserted, not proven. Do not face the internet.

const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const IDENTITY_FILE = path.join(os.homedir(), '.wiki', 'local-author.json')

const loadIdentity = () => {
  try {
    return JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8'))
  } catch {
    return null // no identity → read-only farm
  }
}

const globMatch = (pattern, str) =>
  new RegExp(
    '^' + pattern.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$',
  ).test(str)

module.exports = (log, loga, argv) => {
  const security = {}
  const identity = loadIdentity()
  let owner = ''

  // Per-site domain: argv.id is {farm}/{domain}/status/owner.json
  const domain = path.basename(path.dirname(path.dirname(argv.id)))

  security.retrieveOwner = cb => {
    fs.readFile(argv.id, (err, data) => {
      if (!err) {
        try { owner = JSON.parse(data) } catch { owner = '' }
      } else {
        owner = ''
      }
      cb()
    })
  }

  security.getOwner = () => owner?.name || ''
  security.getUser = () => identity?.name || ''

  security.isAuthorized = () => {
    if (!identity) return false
    if (identity.admin) return true
    if (owner === '') return true // unclaimed — claimable as in legacy mode
    const ownerId = owner?.oauth2?.id || owner?.oauth2?.username
    if (ownerId && ownerId === identity.id) return true
    return (identity.sites || []).some(g => globMatch(g, domain))
  }

  security.isAdmin = () => Boolean(identity?.admin)

  security.defineRoutes = (app, cors) => {
    // Provenance middleware: stamp every page action with the local author.
    app.use((req, res, next) => {
      if (req.method === 'PUT' && /^\/page\/[^/]+\/action/.test(req.path) && identity) {
        try {
          const action = JSON.parse(req.body?.action || '{}')
          action.author ||= { name: identity.name, id: identity.id }
          req.body.action = JSON.stringify(action)
        } catch { /* malformed action — let the pagehandler reject it */ }
      }
      next()
    })
    app.post('/login', cors, (req, res) => res.json({ ownerName: security.getOwner() }))
    app.get('/logout', cors, (req, res) => res.send('OK'))
  }

  return security
}
