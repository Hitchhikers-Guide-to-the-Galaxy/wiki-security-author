# wiki-security-author

> **⚠️ LOCAL USE ONLY — identity is asserted, not proven. Do not face the internet.**
>
> This security module trusts a plain JSON file on the local machine to say who
> you are. That is exactly right for a personal mirror farm on `127.0.0.1`, and
> exactly wrong for anything reachable by anyone else.

Per-site authorization for a **local mirror farm** of public
[Federated Wiki](http://fed.wiki.org) sites — the offline-authoring half of a
two-farm setup where real DNS normally serves the public domains remotely and a
local farm serves the same page folders when you toggle offline.

Who you are comes from a local identity file (the machine is the login):

```json
// ~/.wiki/local-author.json
{
  "name":  "David Bovill",     // provenance display name
  "id":    "david",            // matched against owner.json oauth2.id/username
  "admin": true,               // optional: edit every site, wiki admin
  "sites": ["david.*"]         // optional: extra editable-site globs
}
```

## What it does

- **Per-site authorization.** A site is editable when `identity.admin` is set,
  when the site's `status/owner.json` oauth2 id/username equals `identity.id`,
  or when the domain matches one of the `identity.sites` globs. Everything else
  is readable, not writable. Unclaimed sites (no `owner.json`) are editable —
  fork-and-claim still works. No identity file → the whole farm is read-only.
- **Provenance stamping.** Every journal action saved through this server is
  stamped with `"author": {"name": ..., "id": ...}` — an additive field that
  travels with the page through sync and forks, so offline edits stay
  attributable after they reach the live site.
- **Mirror cue.** The client bundle marks every mirror-served wiki with a warm
  parchment background, an amber top stripe, and a small `local mirror` badge —
  so when `/etc/hosts` is diverting real domain names you always know you are
  looking at the local copy, not the live site.
- **`window.isLocalMirror` flag.** The client also sets `window.isLocalMirror =
  true` at script load — the machine-readable form of the same fact. Local-first
  plugins (e.g. wiki-plugin-terminal) use it to offer live behaviour on
  mirror-served public domains, where the hostname alone says nothing about
  being local. Live sites never serve this client, so the flag never appears
  there.

## Install

```sh
npm install wiki-security-author   # in the wiki install (same node_modules as wiki-server)
```

Then start the farm with:

```sh
wiki --security_type author --farm --data ~/path/to/mirror
```

`wiki-server` resolves `--security_type author` to this package by name
(`wiki-security-author`), the same convention as `wiki-security-friends` and
`wiki-security-passportjs`.

## Design note

This module is the strangler seam for future p2p / trust-graph security
(Proof of Understanding, human.tech): replace the identity file with key
material and the two authorization functions with attestation checks; nothing
else in the wiki needs to change.

## License

MIT
