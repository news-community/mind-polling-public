---
name: draft-a-poll
description: "Draft a Mind Polling poll of AI models for a person who has no Mind Polling account: price it, give them a private link that opens it filled in for them to check and start, and later learn whether they saved it. Use when someone asks you to set up a poll on Mind Polling, or to track what ChatGPT, Claude, Gemini or Grok answer to a question over time, and they have no Mind Polling key."
---

# Draft a poll on Mind Polling for someone

Mind Polling (https://mindpolling.com/) polls AI models the way pollsters poll people: fixed questions, asked of chosen models on a schedule, every answer kept. You can draft a poll for a person who has no account, with no key of your own. Nothing you do here spends anything or publishes anything: the person saves the draft, funds their account and starts the poll themselves.

The map: [llms.txt](https://mindpolling.com/llms.txt) for the site, [the API guide](https://mindpolling.com/docs/api.md) for every operation, and the MCP server at https://mindpolling.com/mcp (each step below is one of its tools, or a POST to the REST address beside it).

## Steps

1. Ask what the person wants to find out, and which models they care about.
2. `list_models` (GET https://mindpolling.com/api/v1/models): the models a poll can ask, with their prices.
3. `price_poll` (POST https://mindpolling.com/api/v1/estimate): send the definition (questions, wordings, models, schedule) and get what it would cost per run and per month. It saves nothing. Tell the person the price and adjust until they agree.
4. `draft_poll` (POST https://mindpolling.com/api/v1/drafts): send the same definition and get a private `link`, its `expires_at` and a `message` you can pass on. This saves a draft, which nobody can see without the link.
5. Give the person the link, with the lines below.
6. Later, `draft_status` (POST https://mindpolling.com/api/v1/drafts/status, the link's `draft=` token in the body): `waiting`, `opened`, `saved` or `expired`. Follow up from that instead of asking them. Once saved, the poll is theirs and you learn nothing more about it.

If something blocks you or answers wrong, say so with `give_feedback` (POST https://mindpolling.com/api/v1/feedback); never include the link.

## Say

- Nothing is asked of any model and nothing is charged until you open the link, sign in, check the questions and models, and start it yourself.
- Here is what it would cost per run and per month (the price from price_poll, typical and high).
- The link works for 30 days (until the expires_at draft_poll gave).

## Never

- Promise what the models will answer, or how the results will come out.
- Post, share or log the draft link anywhere but to your person: anyone signed in who has it can open the draft.
- Start, fund or run the poll for your person; that is theirs to do once it is saved.
- Present a draft as a published poll: it is private until its owner publishes it.

## If the person has an account

They can sign you in instead: the MCP server asks them to sign in the first time a tool needs their account, or they run `npx mindpolling login`. Then `create_poll` makes the poll in their account directly; anything that spends still needs their yes and a `max_cost_usd`.
