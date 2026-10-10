const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function scene({ reduced = false, paused = false, observe = false } = {}) {
  const element = () => {
    const classes = new Set();
    return {
      textContent: "",
      dataset: {},
      attributes: {},
      listeners: {},
      classList: {
        add: (...names) => names.forEach((name) => classes.add(name)),
        remove: (...names) => names.forEach((name) => classes.delete(name)),
        contains: (name) => classes.has(name),
      },
      addEventListener(name, action) {
        this.listeners[name] = action;
      },
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      focus() {
        this.focused = true;
      },
      scrollIntoView(options) {
        this.scroll = options;
      },
    };
  };
  const selectors = [
    "#signal-demo",
    "#send-signal",
    "#signal-button-text",
    "#sender-status",
    "#signal-caption",
    "#signal-symbol",
    "#send-heading",
    "#receive-heading",
    "#receive-notice",
    "#receive-detail",
    "#receiver-feeling",
    "#receiver-options",
    ".travelling-signal",
    "#replay-signal",
    "#try-live-like",
  ];
  const nodes = Object.fromEntries(
    selectors.map((selector) => [selector, element()]),
  );
  const choices = ["ping", "like"].map((signal) => ({
    ...element(),
    dataset: { signal },
  }));
  const root = element();
  if (paused) root.classList.add("motion-paused");
  const timers = new Map();
  let nextTimer = 0,
    observer;
  const window = { addEventListener() {} };
  class Observer {
    constructor(callback) {
      observer = this;
      this.callback = callback;
    }
    observe(node) {
      this.node = node;
    }
    disconnect() {
      this.disconnected = true;
    }
  }
  if (observe) window.IntersectionObserver = Observer;
  const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
  const start = source.indexOf("(() => {\n  const demo =");
  const end = source.indexOf("(() => {\n  const form =", start);
  assert.ok(start >= 0 && end > start);
  vm.runInNewContext(source.slice(start, end), {
    document: {
      querySelector: (selector) => nodes[selector],
      querySelectorAll: () => choices,
      documentElement: root,
    },
    window,
    IntersectionObserver: Observer,
    matchMedia: () => ({ matches: reduced }),
    setTimeout(callback) {
      const id = ++nextTimer;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    fetch() {
      assert.fail("The illustration must never send a network request");
    },
  });
  return {
    nodes,
    choices,
    timers,
    observer,
    click: (selector) => nodes[selector].listeners.click(),
    finish: () => {
      for (const [id, callback] of timers) {
        timers.delete(id);
        callback();
      }
    },
  };
}

test("Ping demonstration distinguishes sending from received, then supports replay", () => {
  const s = scene();
  s.click("#send-signal");
  assert.equal(s.nodes["#send-signal"].disabled, true);
  assert.ok(s.nodes["#signal-demo"].classList.contains("sending"));
  assert.equal(s.nodes["#signal-demo"].classList.contains("received"), false);
  s.finish();
  assert.ok(s.nodes["#signal-demo"].classList.contains("received"));
  assert.match(s.nodes["#signal-caption"].textContent, /Ping received/);
  assert.equal(s.nodes["#send-signal"].disabled, false);
  s.click("#replay-signal");
  assert.ok(s.nodes["#signal-demo"].classList.contains("sending"));
});
test("switching modes cancels pending Ping and Live Like offers no invitation", () => {
  const s = scene();
  s.click("#send-signal");
  s.choices[1].listeners.click();
  assert.equal(s.timers.size, 0);
  assert.equal(s.nodes["#signal-demo"].dataset.mode, "like");
  assert.equal(s.nodes["#receiver-options"].hidden, true);
  assert.equal(s.choices[1].attributes["aria-pressed"], "true");
  s.click("#send-signal");
  s.finish();
  assert.match(
    s.nodes["#signal-caption"].textContent,
    /No conversation required/,
  );
});
test("reduced motion and paused motion skip delay but keep final feedback", () => {
  for (const options of [{ reduced: true }, { paused: true }]) {
    const s = scene(options);
    s.click("#try-live-like");
    assert.equal(s.timers.size, 0);
    assert.equal(s.nodes["#signal-demo"].scroll.behavior, "instant");
    assert.ok(s.nodes["#signal-demo"].classList.contains("received"));
    assert.equal(s.nodes["#send-signal"].focused, true);
  }
});
test("scroll demonstration disconnects after first entry and respects reduced motion", () => {
  const s = scene({ observe: true });
  s.observer.callback([{ isIntersecting: false }]);
  assert.equal(s.timers.size, 0);
  s.observer.callback([{ isIntersecting: true }]);
  assert.equal(s.observer.disconnected, true);
  assert.equal(s.timers.size, 1);
  const quiet = scene({ observe: true, reduced: true });
  quiet.observer.callback([{ isIntersecting: true }]);
  assert.equal(quiet.timers.size, 0);
});
