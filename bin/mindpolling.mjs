#!/usr/bin/env node
/**
 * mindpolling: Mind Polling from a terminal.
 *
 *   mindpolling                              the tools, as the server lists them today
 *   mindpolling list_polls                   one tool
 *   mindpolling get_results <poll>           a first bare word fills the tool's first required argument
 *   mindpolling list_polls --limit 5         its arguments as --name value
 *   mindpolling create_poll --json '{...}'   any arguments as JSON, objects included
 *   mindpolling mcp                          an MCP server on standard input and output
 *
 * A client of the hosted MCP server at https://mindpolling.com/mcp, not a second API. Its commands
 * are that server's tools, read live (tools/list), so a tool the server adds is a command here with
 * no new release. `mcp` is a bridge for a client that can only start a local program: it passes
 * tools, prompts and resources through unchanged and names none of them.
 *
 * Each result is printed as JSON; a refusal goes to standard error with exit code 1.
 *
 * MIND_POLLING_API_KEY   a key, sent as Authorization: Bearer. Without it: public polls.
 *                        A key that starts mp_test_ is the sandbox (https://mindpolling.com/sandbox).
 * MIND_POLLING_MCP_URL   another server (a local one, or a test).
 */
import { readFileSync } from "node:fs";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const ENDPOINT = process.env.MIND_POLLING_MCP_URL || "https://mindpolling.com/mcp";
const KEY = process.env.MIND_POLLING_API_KEY;

async function connect(name) {
  const client = new Client({ name, version });
  await client.connect(new StreamableHTTPClientTransport(new URL(ENDPOINT), KEY ? { requestInit: { headers: { Authorization: `Bearer ${KEY}` } } } : undefined));
  return client;
}

/** A value from the command line, as the tool's own schema types it. */
function typed(schema = {}, raw) {
  const type = Array.isArray(schema.type) ? schema.type.find((t) => t !== "null") : schema.type;
  if (type === "integer" || type === "number") return Number(raw);
  if (type === "boolean") return raw !== "false";
  if (type === "object" || type === "array") return JSON.parse(raw);
  return raw;
}

/** The arguments for a tool, from the words that followed its name. */
export function argumentsFor(tool, words) {
  const props = tool.inputSchema?.properties ?? {};
  const first = (tool.inputSchema?.required ?? [])[0] ?? Object.keys(props)[0];
  const args = {};
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word === "--json") {
      Object.assign(args, JSON.parse(words[++i]));
    } else if (word.startsWith("--")) {
      const [key, inline] = word.slice(2).split(/=(.*)/s);
      const next = words[i + 1];
      const raw = inline !== undefined ? inline : next === undefined || next.startsWith("--") ? "true" : words[++i];
      args[key] = typed(props[key], raw);
    } else if (first && !(first in args)) {
      args[first] = typed(props[first], word);
    } else {
      throw new Error(`"${word}" is not an argument of ${tool.name}: name it, as --key value`);
    }
  }
  return args;
}

/** The tools and how to call each. */
export function usage(tools) {
  const lines = [`mindpolling ${version}: Mind Polling from a terminal (${ENDPOINT})`, "", "Usage: mindpolling <tool> [first argument] [--key value ...] [--json '{...}']", "       mindpolling mcp    an MCP server on standard input and output", ""];
  for (const tool of tools) {
    const props = Object.keys(tool.inputSchema?.properties ?? {});
    const required = new Set(tool.inputSchema?.required ?? []);
    lines.push(`  ${tool.name}${props.length ? ` ${props.map((p) => (required.has(p) ? `--${p}` : `[--${p}]`)).join(" ")}` : ""}`);
    lines.push(`      ${String(tool.description ?? "").split(/(?<=\.)\s/)[0]}`);
  }
  lines.push("", KEY ? "Calling with the key in MIND_POLLING_API_KEY." : "No key set: public polls only. Set MIND_POLLING_API_KEY for your own; a test key (mp_test_) is the sandbox.");
  return lines.join("\n");
}

async function command(argv) {
  const [name, ...words] = argv;
  if (name === "--version") {
    process.stdout.write(`${version}\n`);
    return 0;
  }
  const client = await connect("mindpolling");
  try {
    const { tools } = await client.listTools();
    if (!name || name === "help" || name === "--help" || name === "-h") {
      process.stdout.write(`${usage(tools)}\n`);
      return 0;
    }
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      process.stderr.write(`No tool is named ${name}. The tools: ${tools.map((t) => t.name).join(", ")}.\n`);
      return 2;
    }
    const result = await client.callTool({ name, arguments: argumentsFor(tool, words) });
    const text = result.content?.[0]?.text;
    let body = result.structuredContent;
    if (!body) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    (result.isError ? process.stderr : process.stdout).write(`${typeof body === "string" ? body : JSON.stringify(body, null, 2)}\n`);
    return result.isError ? 1 : 0;
  } finally {
    await client.close();
  }
}

// Each request the bridge passes on, and the capability the hosted server must declare for it.
const FORWARDED = [
  ["tools", "tools/list", (remote, params) => remote.listTools(params)],
  ["tools", "tools/call", (remote, params) => remote.callTool(params)],
  ["prompts", "prompts/list", (remote, params) => remote.listPrompts(params)],
  ["prompts", "prompts/get", (remote, params) => remote.getPrompt(params)],
  ["resources", "resources/list", (remote, params) => remote.listResources(params)],
  ["resources", "resources/templates/list", (remote, params) => remote.listResourceTemplates(params)],
  ["resources", "resources/read", (remote, params) => remote.readResource(params)],
];

async function bridge() {
  // The server half is loaded only here, so a command never pays for it.
  const [{ Server }, { StdioServerTransport }] = await Promise.all([import("@modelcontextprotocol/server"), import("@modelcontextprotocol/server/stdio")]);
  const remote = await connect("mindpolling-bridge");
  const capabilities = remote.getServerCapabilities() ?? {};
  const local = new Server(remote.getServerVersion(), { capabilities, instructions: remote.getInstructions() });
  for (const [capability, method, forward] of FORWARDED) {
    if (capabilities[capability]) local.setRequestHandler(method, (request) => forward(remote, request.params));
  }
  local.onclose = () => remote.close();
  await local.connect(new StdioServerTransport());
}

const argv = process.argv.slice(2);
if (argv[0] === "mcp") {
  // Standard output belongs to the protocol: say why on standard error and exit, so the client
  // reports a server that failed to start, never one that hangs.
  bridge().catch((error) => {
    process.stderr.write(`mindpolling mcp: could not reach ${ENDPOINT}: ${error.message}\n`);
    process.exit(1);
  });
} else {
  command(argv).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      process.stderr.write(`mindpolling: ${error.message}\n`);
      process.exitCode = 1;
    },
  );
}
