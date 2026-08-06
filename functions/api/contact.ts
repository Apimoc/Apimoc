/**
 * Contact form handler. Runs as a Cloudflare Pages Function, so it sits
 * alongside the static build without turning the whole site into SSR.
 *
 * Order of checks is deliberate: the cheapest rejections happen first, so a
 * flood of bot traffic never reaches the Turnstile API or Resend.
 *   1. Honeypot        free
 *   2. Field validation free
 *   3. Rate limit      one KV read
 *   4. Turnstile       one outbound request
 *   5. Resend          one outbound request
 *
 * Secrets live in Cloudflare Pages environment variables and are read only
 * here. Nothing in this file is ever sent to the browser.
 */

interface Env {
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  /** Verified sender, for example "site@yourdomain.com". */
  CONTACT_FROM?: string;
  /** Where the message is delivered. */
  CONTACT_TO?: string;
  /** Optional KV namespace for rate limiting. Falls back to open if absent. */
  RATE_LIMIT?: KVNamespace;
}

/** Error keys, matched to the messages in src/content/ui.ts. */
type ErrorKey =
  | "nameRequired"
  | "emailRequired"
  | "emailInvalid"
  | "messageRequired"
  | "messageTooShort"
  | "messageTooLong"
  | "turnstileRequired"
  | "turnstileFailed"
  | "rateLimited"
  | "server";

const MAX_PER_HOUR = 5;

function fail(error: ErrorKey, status = 400): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("server", 400);
  }

  const read = (key: string) => String(form.get(key) ?? "").trim();

  /* 1. Honeypot. A real browser never fills this: it is visually hidden,
     removed from the accessibility tree and excluded from tab order. Return
     200 so a bot cannot tell it was caught and retry with the field blank. */
  if (read("company_website")) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  /* 2. Validation. Repeated server side because the client checks are a
     convenience, not a control. */
  const name = read("name");
  const email = read("email");
  const org = read("org");
  const message = read("message");

  if (!name) return fail("nameRequired");
  if (!email) return fail("emailRequired");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("emailInvalid");
  if (!message) return fail("messageRequired");
  if (message.length < 20) return fail("messageTooShort");
  if (message.length > 4000) return fail("messageTooLong");
  if (name.length > 200 || org.length > 200) return fail("server");

  /* 3. Rate limit by IP. Cloudflare sets CF-Connecting-IP and it cannot be
     spoofed by the client at this layer. */
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (env.RATE_LIMIT) {
    const key = `contact:${ip}`;
    const seen = Number((await env.RATE_LIMIT.get(key)) ?? "0");
    if (seen >= MAX_PER_HOUR) return fail("rateLimited", 429);
    await env.RATE_LIMIT.put(key, String(seen + 1), { expirationTtl: 3600 });
  }

  /* 4. Turnstile. */
  if (env.TURNSTILE_SECRET_KEY) {
    const token = read("cf-turnstile-response");
    if (!token) return fail("turnstileRequired");

    const body = new FormData();
    body.append("secret", env.TURNSTILE_SECRET_KEY);
    body.append("response", token);
    body.append("remoteip", ip);

    try {
      const verify = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        { method: "POST", body },
      );
      const result = (await verify.json()) as { success?: boolean };
      if (!result.success) return fail("turnstileFailed");
    } catch {
      return fail("server", 502);
    }
  }

  /* 5. Deliver. */
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM || !env.CONTACT_TO) {
    // Misconfiguration is a server problem, and the message says so rather
    // than pretending the send succeeded.
    return fail("server", 500);
  }

  const subject = `Website contact: ${name}`;
  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    org ? `Company: ${org}` : null,
    "",
    message,
  ].filter((line): line is string => line !== null);

  try {
    const send = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        // So a reply goes to the sender rather than to the site address.
        reply_to: email,
        subject,
        text: lines.join("\n"),
        html: lines
          .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br>"))
          .join(""),
      }),
    });

    if (!send.ok) return fail("server", 502);
  } catch {
    return fail("server", 502);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
