/**
 * Exercises the contact Pages Function directly, without Cloudflare.
 *
 * The handler is a plain module that takes { request, env }, so it can be
 * driven with real FormData and a stubbed env. Turnstile and Resend are
 * stubbed at the fetch boundary, which is the only place the function talks
 * to the outside world.
 *
 * Usage:  node scripts/test-contact.mjs
 */

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { transformSync } from "esbuild";

// Strip the TypeScript types so the handler can be imported directly.
const source = readFileSync("functions/api/contact.ts", "utf8");
const js = transformSync(source, { loader: "ts", format: "esm" }).code;
const dir = mkdtempSync(join(tmpdir(), "contact-"));
const file = join(dir, "contact.mjs");
writeFileSync(file, js);
const { onRequestPost } = await import(file);

const ENV = {
  TURNSTILE_SECRET_KEY: "test-secret",
  RESEND_API_KEY: "test-key",
  CONTACT_FROM: "site@example.com",
  CONTACT_TO: "inbox@example.com",
};

let turnstilePasses = true;
let sent = null;

globalThis.fetch = async (url, init) => {
  if (String(url).includes("siteverify")) {
    return new Response(JSON.stringify({ success: turnstilePasses }));
  }
  if (String(url).includes("api.resend.com")) {
    sent = JSON.parse(init.body);
    return new Response("{}", { status: 200 });
  }
  throw new Error("unexpected outbound request to " + url);
};

function makeRequest(fields) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return new Request("https://example.com/api/contact", {
    method: "POST",
    body: form,
    headers: { "CF-Connecting-IP": "203.0.113.9" },
  });
}

const VALID = {
  name: "Regional Director",
  email: "director@example.com",
  org: "Example Management",
  message: "We have an opening and would like to talk about the portfolio.",
  "cf-turnstile-response": "token",
};

const results = [];
const check = (name, pass, detail = "") => results.push({ name, pass, detail });

async function run(fields, env = ENV) {
  sent = null;
  const response = await onRequestPost({ request: makeRequest(fields), env });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

/* 1. A good message is delivered. */
{
  const r = await run(VALID);
  check(
    "valid message is accepted and handed to Resend",
    r.status === 200 && r.body.ok === true && sent !== null,
    `status=${r.status} to=${sent?.to} reply_to=${sent?.reply_to}`,
  );
  check(
    "reply-to is the sender, so a reply reaches them",
    sent?.reply_to === VALID.email,
    String(sent?.reply_to),
  );
}

/* 2. Validation, server side, independent of the browser. */
for (const [label, fields, expected] of [
  ["missing name", { ...VALID, name: "" }, "nameRequired"],
  ["missing email", { ...VALID, email: "" }, "emailRequired"],
  ["malformed email", { ...VALID, email: "not-an-address" }, "emailInvalid"],
  ["empty message", { ...VALID, message: "" }, "messageRequired"],
  ["message too short", { ...VALID, message: "too short" }, "messageTooShort"],
  ["message too long", { ...VALID, message: "x".repeat(4001) }, "messageTooLong"],
  ["missing turnstile token", { ...VALID, "cf-turnstile-response": "" }, "turnstileRequired"],
]) {
  const r = await run(fields);
  check(
    `rejects ${label}`,
    r.status === 400 && r.body.error === expected && sent === null,
    `status=${r.status} error=${r.body.error}`,
  );
}

/* 3. Spam. The honeypot returns 200 so a bot cannot learn it was caught,
      but nothing is delivered. */
{
  const r = await run({ ...VALID, company_website: "https://spam.example" });
  check(
    "honeypot: rejected silently, nothing delivered",
    r.status === 200 && sent === null,
    `status=${r.status} delivered=${sent !== null}`,
  );
}

/* 4. A failed Turnstile check blocks delivery. */
{
  turnstilePasses = false;
  const r = await run(VALID);
  check(
    "failed Turnstile check blocks delivery",
    r.status === 400 && r.body.error === "turnstileFailed" && sent === null,
    `status=${r.status} error=${r.body.error}`,
  );
  turnstilePasses = true;
}

/* 5. Rate limiting, backed by a stub KV. */
{
  const store = new Map();
  const env = {
    ...ENV,
    RATE_LIMIT: {
      get: async (k) => store.get(k) ?? null,
      put: async (k, v) => void store.set(k, v),
    },
  };
  let limited = null;
  for (let i = 0; i < 7; i += 1) {
    const r = await run(VALID, env);
    if (r.status === 429) {
      limited = i;
      break;
    }
  }
  check(
    "rate limits repeated sends from one IP",
    limited === 5,
    `blocked on attempt ${limited === null ? "never" : limited + 1}`,
  );
}

/* 6. Misconfiguration is reported, not silently swallowed. */
{
  const r = await run(VALID, { TURNSTILE_SECRET_KEY: "x" });
  check(
    "missing Resend configuration returns an error rather than a false success",
    r.status === 500 && r.body.error === "server",
    `status=${r.status} error=${r.body.error}`,
  );
}

const pad = Math.max(...results.map((r) => r.name.length));
console.log("");
let failed = 0;
for (const { name, pass, detail } of results) {
  if (!pass) failed += 1;
  console.log(`  ${pass ? "pass" : "FAIL"}  ${name.padEnd(pad)}  ${detail}`);
}
console.log(`\n  ${results.length - failed}/${results.length} passed\n`);
process.exit(failed > 0 ? 1 : 0);
