#!/usr/bin/env node
// Read one public poll of AI models from Mind Polling and print what each model answered in its
// latest run, with the 95% range and the number of answers behind it. No key, nothing to install.
//
//   node examples/read-a-poll.mjs                      the most recently run public poll
//   node examples/read-a-poll.mjs state-economy-outlook  a poll by its address or id
//   node examples/read-a-poll.mjs --base http://localhost:1936   against another server
//
// The API guide: https://mindpolling.com/docs/api.md

const args = process.argv.slice(2);
const flag = args.indexOf("--base");
const base = flag >= 0 ? args[flag + 1] : "https://mindpolling.com";
// The poll: the one argument that is neither the flag nor its value.
const wanted = args.find((a, i) => !a.startsWith("--") && (flag < 0 || i !== flag + 1));
if (!base) fail("--base needs an address, such as https://mindpolling.com");

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** GET a path of the API. An error is the API's own sentence, with what it suggests. */
async function get(path) {
  const response = await fetch(`${base}/api/v1${path}`, { headers: { Accept: "application/json" } });
  const body = await response.json();
  if (!response.ok) fail(`${response.status} ${body.code}: ${body.error}${body.suggestion ? ` ${body.suggestion}` : ""}`);
  return body.data;
}

const percent = (x) => `${Math.round(x * 100)}%`;
const number = (x) => String(Math.round(x * 100) / 100);

const polls = wanted ? null : await get("/polls");
if (polls && polls.length === 0) fail("There are no public polls to read.");
const poll = await get(`/polls/${encodeURIComponent(wanted ?? polls[0].id)}`);
const results = await get(`/polls/${poll.id}/results`);

console.log(`${poll.title}\n${poll.url}\n`);
for (const [i, question] of results.questions.entries()) {
  console.log(`Question ${i + 1}: ${question.text}`);
  const points = question.shares.length ? question.shares : question.means;
  if (!points.length) {
    console.log("  No answers yet.\n");
    continue;
  }
  // The latest run, by its time. A run's figures can pool earlier runs: see `pools` in the results.
  const latest = points.reduce((a, p) => (p.at > a ? p.at : a), "");
  const byModel = new Map();
  for (const p of points.filter((x) => x.at === latest)) byModel.set(p.model, [...(byModel.get(p.model) ?? []), p]);
  for (const [model, rows] of byModel) {
    if (question.shares.length) {
      // The answer this model gave most often, as a share of its answers.
      const top = rows.reduce((a, r) => (r.share > a.share ? r : a));
      console.log(`  ${model}: ${top.option}, ${percent(top.share)} of ${top.n} answers (95% range ${percent(top.low)} to ${percent(top.high)})`);
    } else {
      const m = rows[0];
      console.log(`  ${model}: average ${number(m.mean)} over ${m.n} answers (95% range ${number(m.low)} to ${number(m.high)})`);
    }
  }
  console.log(`  Latest run: ${latest.slice(0, 10)}\n`);
}
