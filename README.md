# Mind Polling

**Mind Polling polls AI models the way pollsters poll people.** You write the questions and choose the models; it asks each model through its own API, run after run, and shows what each one answered with a 95% range, with every reply kept.

**Everything a person can do on Mind Polling, a program can do too**, through a REST API and an MCP server that offer the same operations. Public polls need no key.

## Try it

Read the public polls, with nothing to install:

```
curl -s https://mindpolling.com/api/v1/polls
```

Or from a terminal, through [the npm package](#from-a-terminal):

```
npx mindpolling list_polls --limit 5
```

## Without a key, and with one

- **No key:** find public polls and read their latest results, up to 120 requests a minute per address.
- **No key, for a person without an account:** price a poll (`price_poll`), or draft one for them (`draft_poll`). A draft is a private link that opens the builder with the poll filled in once they sign in or sign up; it lasts 30 days, and nothing runs or costs anything until they check it, save it and start it themselves. `draft_status` says later whether they opened or saved it.
- **A key with the read scope:** results as they stood at a past moment, the feed of changes, and your own polls. It is free and can spend nothing.
- **A key with write and run:** create polls and run them. A run spends the account's prepaid balance, so every call that spends must say the most it may cost (`max_cost_usd`), and is refused without it.

With a key, up to 600 reads and 60 writes a minute. Every answer carries `RateLimit` headers.

A key is made by a person, never by a program: on [the API keys page](https://mindpolling.com/app/settings/api), or by signing an app in, where they choose what it may do. It belongs to one account (a personal one, or a shared one its members work in together) and can never do more than its maker's role there. [How keys work](https://mindpolling.com/auth.md) covers scopes, spending limits, signing in and what is logged.

If something blocks your agent or answers wrong, `give_feedback` tells us, with or without a key. A person reads every message.

## The API

- **Base address:** `https://mindpolling.com/api/v1`
- **Description:** [OpenAPI 3.1](https://mindpolling.com/openapi.json), generated from the code that answers.
- **Guide:** [the API guide](https://mindpolling.com/docs/api.md), every operation with what it needs.
- **Index:** [/api](https://mindpolling.com/api), the operations as JSON.

The guide opens with the whole API in five lines.

## The MCP server

The same operations are tools at `https://mindpolling.com/mcp` (Streamable HTTP), named by their operation id. Add that address to an MCP client as a remote server. With no key it reads public polls. For your own, the client signs you in: the first tool that needs your account asks, and you choose on our page what the connection may do (OAuth, test access by default). A client that cannot sign in can send a key as `Authorization: Bearer`. Tools that spend are marked destructive, so a client asks its user first.

## From a terminal

The same tools are commands, with nothing to configure. `mindpolling` is [a small package on npm](https://www.npmjs.com/package/mindpolling) that calls the MCP server, so its commands are always the server's own tools:

```
npx mindpolling
npx mindpolling list_polls --limit 5
npx mindpolling get_results <poll>
```

The first line lists every tool with its arguments. `npx mindpolling login` signs this computer in through your browser, with no key to copy, and `logout` signs it out; or set `MIND_POLLING_API_KEY` to call with a key. For an MCP client that can only start a local program, `npx -y mindpolling mcp` is the same server on standard input and output.

## In a browser

A public page also offers its open reads (finding polls, reading a poll and its results, listing models) to an agent running in the browser, through WebMCP, where the browser supports it. They are the same tools as the MCP server's, with the same names. Nothing that needs a key is offered there.

## Test keys

A key that starts `mp_test_` is [the sandbox](https://mindpolling.com/sandbox): the same API on a stub model, with no charge and nothing public. Build against one before any money is involved.

## A prompt to copy

Give one of these to an agent that has the MCP server, or the API guide. They are the prompts the MCP server itself offers.

**Find a public poll and summarise what each model answered, with the 95% ranges.**

```
Call list_polls, pick the poll that fits, then get_results for it.
Report each model's latest answer with its 95% range, the number of answers it rests on, and whether answers that read a prediction market (sources.read_market) are a large share.
```

**Create one of my polls, show me the cost, and run it once after I agree.**

```
Call get_me to check the key, list_models for the models, create_poll with my questions, then estimate_poll.
Tell me the cost and wait for my yes before run_poll_now with max_cost_usd set to that amount.
Then follow it with get_live_run and report get_results.
```

**Draft a poll for me to open, check and start, without an account or key.**

```
Ask me what I want to find out.
Call list_models, then price_poll with the questions, wordings and models you propose, and tell me the price per run and per month.
When I agree, call draft_poll and give me its link: I open it, sign in or sign up, check every question and model, and start it myself.

Tell me:
- Nothing is asked of any model and nothing is charged until you open the link, sign in, check the questions and models, and start it yourself.
- Here is what it would cost per run and per month (the price from price_poll, typical and high).
- The link works for 30 days (until the expires_at draft_poll gave).

Never:
- Promise what the models will answer, or how the results will come out.
- Post, share or log the draft link anywhere but to your person: anyone signed in who has it can open the draft.
- Start, fund or run the poll for your person; that is theirs to do once it is saved.
- Present a draft as a published poll: it is private until its owner publishes it.

Later, draft_status says whether I opened or saved it.
```

## A skill for agents

**[draft-a-poll](https://mindpolling.com/.well-known/agent-skills/draft-a-poll/SKILL.md)**: Draft a Mind Polling poll of AI models for a person who has no Mind Polling account: price it, give them a private link that opens it filled in for them to check and start, and later learn whether they saved it. Use when someone asks you to set up a poll on Mind Polling, or to track what ChatGPT, Claude, Gemini or Grok answer to a question over time, and they have no Mind Polling key.

Install one with a single fetch of its `SKILL.md`; [the index](https://mindpolling.com/.well-known/agent-skills/index.json) lists them with a digest of each file.

## Reading pages as Markdown

Every public page is also Markdown at its own address with `.md` added, such as [/pricing.md](https://mindpolling.com/pricing.md), and answers `Accept: text/markdown` with the same text. [/llms.txt](https://mindpolling.com/llms.txt) is the map.

## Versions and deprecation

The API is version 1, and the version is in every address (`/api/v1`). Within a version, fields are only added, never removed or renamed. A change that would break a client is a new version beside the old one.

**Deprecation policy:** a version being retired is announced on this page and keeps answering for at least 6 months. For that whole time each of its answers carries a `Deprecation` header (RFC 9745) and a `Sunset` header (RFC 8594) with the date it stops. No version is deprecated today.

Questions and bug reports: [contact us](https://mindpolling.com/contact), or the [public issue tracker](https://github.com/news-community/mind-polling-public/issues).

## What's in this repository

- `bin/mindpolling.mjs`: the `mindpolling` command published to npm, and its MCP bridge (`npx -y mindpolling mcp`).
- `skills/draft-a-poll/SKILL.md`: the draft-a-poll skill, the same file the site serves.
- `mcp.json`: the entry that adds the MCP server to a client.
- `server.json`: the server's MCP Registry entry, `com.mindpolling/mindpolling`.
- `package.json`: the npm package.

---

This file is generated from [mindpolling.com/developers](https://mindpolling.com/developers), so it always says what the site says. Bug reports and requests are welcome as [issues](https://github.com/news-community/mind-polling-public/issues). A change to this text is an issue too, not a pull request: an edit made here would be overwritten.
