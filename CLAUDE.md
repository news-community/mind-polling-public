# Mind Polling, the public repository

Mind Polling's public face on GitHub: its issue tracker, a README, the entry an MCP client needs,
the MCP Registry entry, and the `mindpolling` package on npm. The application is private; none of
its code is here.

Four rules:

1. **Everything here is public the moment it is pushed.** No key, no internal document, no private
   poll's data.
2. **`README.md`, `mcp.json` and `server.json` are generated** in the private repository
   (`npm run public-repo` there) from the site's own developers page, its addresses and this
   folder's `package.json`. Never edit them here: the next generation overwrites the edit, and the
   private repository's check fails until it does.
3. **`bin/mindpolling.mjs` names no tool.** Its commands are the hosted server's tools, read live,
   and `mindpolling mcp` passes everything through. A new tool on the site needs no change here.
   It must run against the live server with no key: `node bin/mindpolling.mjs list_polls`.
4. **One version, in `package.json`.** After changing it, run `npm run public-repo` in the private
   repository, which rewrites `server.json` to match. Publishing to npm and to the registry is the
   owner's step, never an agent's on its own.
