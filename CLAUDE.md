# Mind Polling, the public repository

Mind Polling's public face on GitHub: its issue tracker, a README, the entry an MCP client needs,
and one example. The application is private; none of its code is here.

Three rules:

1. **Everything here is public the moment it is pushed.** No key, no internal document, no private
   poll's data.
2. **`README.md` and `mcp.json` are generated** in the private repository (`npm run public-repo`
   there) from the site's own developers page and addresses. Never edit them here: the next
   generation overwrites the edit, and the private repository's check fails until it does.
3. **The example must run against the live API with no key:**
   `node examples/read-a-poll.mjs`.
