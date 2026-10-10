const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const handler = require("../api/waitlist.js");
const valid = {
  name: "Demo Person",
  phone: "+1 202 555 0100",
  email: "demo@example.com",
  reason: "Meet people at gigs.",
  suggestions: "",
  website: "",
};

async function api(method, body, config = {}, response = { ok: true }) {
  const keys = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "WAITLIST_WEBHOOK_URL",
  ];
  const previous = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  const originalFetch = global.fetch;
  const calls = [];
  for (const key of keys) {
    if (config[key]) process.env[key] = config[key];
    else delete process.env[key];
  }
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return { text: async () => "", ...response };
  };
  const res = {
    code: 200,
    headers: {},
    status(code) {
      this.code = code;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
      return this;
    },
    end(text) {
      this.payload = JSON.parse(text);
      return this;
    },
  };
  try {
    await handler({ method, body }, res);
    return { ...res, calls };
  } finally {
    global.fetch = originalFetch;
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test("API rejects unsupported methods without contacting storage", async () => {
  const r = await api("GET");
  assert.equal(r.code, 405);
  assert.equal(r.calls.length, 0);
});
test("API returns field errors for invalid entries", async () => {
  const r = await api("POST", {});
  assert.equal(r.code, 400);
  assert.deepEqual(Object.keys(r.payload.fields), [
    "name",
    "phone",
    "email",
    "reason",
  ]);
});
test("API rejects malformed and oversized bodies", async () => {
  assert.equal((await api("POST", "{")).code, 400);
  assert.equal(
    (await api("POST", { ...valid, reason: "x".repeat(13000) })).code,
    400,
  );
});
test("API ignores honeypot submissions without writing data", async () => {
  const r = await api("POST", { ...valid, website: "bot" });
  assert.equal(r.code, 202);
  assert.equal(r.calls.length, 0);
});
test("API does not fake success when storage is unconfigured", async () => {
  assert.equal((await api("POST", valid)).code, 503);
});
test("webhook stores the original signup fields", async () => {
  const r = await api(
    "POST",
    { ...valid, email: "DEMO@example.com" },
    { WAITLIST_WEBHOOK_URL: "https://example.invalid/demo" },
  );
  assert.equal(r.code, 201);
  const data = JSON.parse(r.calls[0].options.body);
  assert.equal(data.email, valid.email);
  assert.equal(data.phone, valid.phone);
  assert.equal(data.reason, valid.reason);
  assert.ok(data.submittedAt);
  assert.equal(data.website, undefined);
  assert.equal(data.suggestions, undefined);
});
test("optional suggestions are saved by both adapters without a schema migration", async () => {
  const signup = { ...valid, suggestions: "  More Live Likes animations.  " };
  const webhook = await api("POST", signup, {
    WAITLIST_WEBHOOK_URL: "https://example.invalid/demo",
  });
  const webhookData = JSON.parse(webhook.calls[0].options.body);
  assert.equal(webhookData.suggestions, "More Live Likes animations.");
  assert.equal(webhookData.reason, valid.reason);
  const db = await api("POST", signup, {
    SUPABASE_URL: "https://example.invalid",
    SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
  });
  assert.equal(db.code, 201);
  const dbData = JSON.parse(db.calls[0].options.body);
  assert.equal(
    dbData.reason,
    `${valid.reason}\n\nFeature suggestions:\nMore Live Likes animations.`,
  );
  assert.equal(dbData.suggestions, undefined);
});
test("suggestions are optional, bounded, and reject non-text input", async () => {
  for (const suggestions of ["x".repeat(1001), { bad: true }, 42]) {
    const r = await api("POST", { ...valid, suggestions });
    assert.equal(r.code, 400);
    assert.ok(r.payload.fields.suggestions);
    assert.equal(r.calls.length, 0);
  }
  const r = await api(
    "POST",
    { ...valid, suggestions: "x".repeat(1000), reason: "y".repeat(1000) },
    { WAITLIST_WEBHOOK_URL: "https://example.invalid/demo" },
  );
  assert.equal(r.code, 201);
});
test("Supabase adapter sends signup to the original table", async () => {
  const r = await api("POST", valid, {
    SUPABASE_URL: "https://example.invalid/",
    SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
  });
  assert.equal(r.code, 201);
  assert.equal(
    r.calls[0].url,
    "https://example.invalid/rest/v1/waitlist_signups",
  );
  assert.deepEqual(JSON.parse(r.calls[0].options.body), {
    name: valid.name,
    phone: valid.phone,
    email: valid.email,
    reason: valid.reason,
  });
});
test("duplicate email and provider failures are not reported as new signups", async () => {
  const config = {
    SUPABASE_URL: "https://example.invalid",
    SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
  };
  assert.equal(
    (await api("POST", valid, config, { ok: false, status: 409 })).code,
    409,
  );
  assert.equal(
    (await api("POST", valid, config, { ok: false, status: 500 })).code,
    502,
  );
});

function client(values, response) {
  const classList = () => ({
    values: new Set(),
    add(v) {
      this.values.add(v);
    },
    remove(v) {
      this.values.delete(v);
    },
    toggle(v, on) {
      on ? this.values.add(v) : this.values.delete(v);
    },
    contains(v) {
      return this.values.has(v);
    },
  });
  const element = () => ({
    classList: classList(),
    hidden: false,
    textContent: "",
    attributes: {},
    setAttribute(k, v) {
      this.attributes[k] = v;
    },
    addEventListener() {},
    focus() {
      this.focused = true;
    },
    scrollIntoView() {},
  });
  const inputs = Object.fromEntries(
    ["name", "phone", "email", "reason", "suggestions"].map((k) => {
      const node = element();
      const field = element();
      node.closest = () => field;
      return [k, node];
    }),
  );
  const errors = Object.fromEntries(
    Object.keys(inputs).map((k) => [k, element()]),
  );
  const form = element();
  form.elements = { namedItem: (k) => inputs[k] };
  form.querySelector = (selector) => errors[selector.match(/"(.*?)"/)[1]];
  form.addEventListener = (_name, callback) => {
    form.submit = callback;
  };
  const nodes = {
    "#waitlist-form": form,
    ".form-card": element(),
    "#form-status": element(),
    "#success-state": element(),
    ".form-submit": element(),
  };
  nodes["#success-state"].hidden = true;
  const calls = [];
  const document = {
    querySelector: (selector) => nodes[selector],
    documentElement: { classList: classList() },
  };
  const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
  const start = source.indexOf("(() => {\n  const form =");
  assert.notEqual(start, -1);
  vm.runInNewContext(source.slice(start), {
    document,
    FormData: class {
      entries() {
        return Object.entries(values);
      }
    },
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async (url, options) => {
      calls.push({ url, data: JSON.parse(options.body) });
      return {
        ok: response.ok,
        status: response.status,
        json: async () => response.payload,
      };
    },
  });
  return {
    nodes,
    inputs,
    errors,
    calls,
    submit: () => form.submit({ preventDefault() {} }),
  };
}
test("client validates before submission and focuses the first invalid field", async () => {
  const c = client({ ...valid, name: "", email: "no" }, {});
  await c.submit();
  assert.equal(c.calls.length, 0);
  assert.ok(c.inputs.name.focused);
  assert.equal(c.inputs.email.attributes["aria-invalid"], "true");
});
test("client only shows success after server confirmation", async () => {
  const c = client(valid, { ok: true, status: 201, payload: { ok: true } });
  await c.submit();
  assert.equal(c.calls[0].url, "/api/waitlist");
  assert.deepEqual(c.calls[0].data, valid);
  assert.equal(c.nodes["#success-state"].hidden, false);
  assert.ok(c.nodes["#success-state"].focused);
  assert.equal(c.nodes["#waitlist-form"].hidden, true);
});
test("client sends optional ideas and validates their length before fetching", async () => {
  const c = client(
    { ...valid, suggestions: "  More reactions please.  " },
    { ok: true, status: 201, payload: { ok: true } },
  );
  await c.submit();
  assert.equal(c.calls[0].data.suggestions, "More reactions please.");
  const invalid = client({ ...valid, suggestions: "x".repeat(1001) }, {});
  await invalid.submit();
  assert.equal(invalid.calls.length, 0);
  assert.ok(invalid.inputs.suggestions.focused);
});
test("client handles duplicate email without displaying false success", async () => {
  const c = client(valid, {
    ok: false,
    status: 409,
    payload: { error: "Duplicate" },
  });
  await c.submit();
  assert.equal(c.nodes["#success-state"].hidden, true);
  assert.match(c.nodes["#form-status"].textContent, /already on the list/);
  assert.equal(c.nodes[".form-submit"].disabled, false);
});
test("client displays server field errors and preserves editable form", async () => {
  const c = client(valid, {
    ok: false,
    status: 400,
    payload: { error: "Check fields", fields: { phone: "Invalid phone" } },
  });
  await c.submit();
  assert.equal(c.errors.phone.textContent, "Invalid phone");
  assert.equal(c.nodes["#waitlist-form"].hidden, false);
});
test("client rejects a successful HTTP response without an ok payload", async () => {
  const c = client(valid, { ok: true, status: 200, payload: {} });
  await c.submit();
  assert.equal(c.nodes["#success-state"].hidden, true);
  assert.match(c.nodes["#form-status"].textContent, /confirm/);
});
