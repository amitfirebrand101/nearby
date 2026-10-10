(() => {
  const steps = [
    {
      title: ["Saw someone?", "Start there."],
      description:
        "Turn on Nearby when you’re open to a hello. See other people who have opted in around you. Real people, in the same real-life moment.",
      tip: "Both of you need Nearby. No surprise Pings to strangers without the app.",
      sticker: "a hello, on your terms ✳",
      source: "day",
      crop: [40, 449, 202, 395],
      alt: "Concept screen showing people nearby",
    },
    {
      title: ["A small tap.", "Not a big scene."],
      description:
        "Send a Ping to break the ice. Or a Live Like to appreciate them, without asking for a conversation. Two little ways to make a real-life moment feel good.",
      tip: "Appreciation is an invitation. It doesn’t mean they owe you a response.",
      sticker: "good energy, sent ↗",
      source: "day",
      crop: [261, 451, 186, 385],
      alt: "Concept screen showing a person and the Ping action",
    },
    {
      title: ["Someone noticed you.", "Feels pretty good."],
      description:
        "Review your appreciation in Tonight. Take a moment, hold it for later or decide it’s not your thing. You get to choose what happens next.",
      tip: "The Android pilot is testing background alerts. Device permissions and battery settings matter.",
      sticker: "a little “you stood out” ✦",
      source: "day",
      crop: [466, 464, 177, 376],
      alt: "Concept screen showing incoming appreciation",
    },
    {
      title: ["A yes, on your terms.", "Share just enough."],
      description:
        "Want to keep talking? Choose the Instagram or WhatsApp details you’d like to share. A Ping alone never gives someone access to your socials.",
      tip: "Only selected contact details are sent. The concept shows extra channels not in the current pilot.",
      sticker: "only what you choose ✓",
      source: "day",
      crop: [867, 456, 195, 382],
      alt: "Concept screen showing a choice of contact details to share",
    },
    {
      title: ["Your moment.", "Your boundaries."],
      description:
        "You decide when to be visible, who to respond to and what to share. Not in the mood? Go invisible. Nothing to explain.",
      tip: "Your chosen name and photo are public while visible. We don’t verify real-world identities.",
      sticker: "your rules. always. ✳",
      source: "night",
      crop: [484, 558, 204, 413],
      alt: "Concept screen showing visibility and privacy choices",
    },
  ];
  const tabs = [...document.querySelectorAll("[data-step]")];
  const panel = document.querySelector("#journey-panel");
  const screen = document.querySelector("#journey-screen");
  const image = document.querySelector("#journey-image");
  let selected = 0;
  let transitionTimer;
  const select = (index, focus = false) => {
    selected = index;
    const step = steps[index];
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", `step-${index}`);
    document.querySelector("#journey-number").textContent =
      `0${index + 1} / 05`;
    document
      .querySelector("#journey-title")
      .replaceChildren(
        document.createTextNode(step.title[0]),
        document.createElement("br"),
        document.createTextNode(step.title[1]),
      );
    document.querySelector("#journey-description").textContent =
      step.description;
    document.querySelector("#pip-tip").textContent = step.tip;
    document.querySelector("#stage-sticker").textContent = step.sticker;
    ["x", "y", "w", "h"].forEach((property, i) =>
      screen.style.setProperty(`--${property}`, step.crop[i]),
    );
    image.src = `assets/concept-${step.source}.webp`;
    image.width = 1080;
    image.height = step.source === "day" ? 1162 : 1135;
    image.alt = step.alt;
    clearTimeout(transitionTimer);
    screen.classList.add("changing");
    transitionTimer = setTimeout(
      () => screen.classList.remove("changing"),
      180,
    );
    if (focus) tabs[index].focus();
  };
  tabs.forEach((tab, index) =>
    tab.addEventListener("click", () => select(index)),
  );
  document
    .querySelector(".journey-tabs")
    ?.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (selected + 1) % steps.length;
      if (event.key === "ArrowLeft")
        next = (selected + steps.length - 1) % steps.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = steps.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        select(next, true);
        tabs[next].scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "instant",
        });
      }
    });
  const motionToggle = document.querySelector("#motion-toggle");
  let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    paused = paused || localStorage.getItem("nearby-motion-paused") === "true";
  } catch {}
  const applyMotion = () => {
    document.documentElement.classList.toggle("motion-paused", paused);
    motionToggle.setAttribute("aria-pressed", String(paused));
    motionToggle.textContent = paused
      ? "Resume animations"
      : "Pause animations";
  };
  applyMotion();
  motionToggle?.addEventListener("click", () => {
    paused = !paused;
    applyMotion();
    try {
      localStorage.setItem("nearby-motion-paused", String(paused));
    } catch {}
  });
  const dialog = document.querySelector("#concept-dialog");
  document
    .querySelector("[data-open-concept]")
    ?.addEventListener("click", () => dialog.showModal());
  document
    .querySelector("#close-concept")
    ?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        dialog.close();
    }
  });
})();

(() => {
  const demo = document.querySelector("#signal-demo");
  if (!demo) return;
  const sendButton = document.querySelector("#send-signal");
  const choices = [...document.querySelectorAll("[data-signal]")];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let mode = "ping",
    timer;
  const text = (id, value) => {
    document.querySelector(id).textContent = value;
  };
  const reduced = () =>
    motion.matches ||
    document.documentElement.classList.contains("motion-paused");
  const reset = () => {
    clearTimeout(timer);
    demo.classList.remove("sending", "received");
    sendButton.disabled = false;
    const like = mode === "like";
    text("#signal-button-text", like ? "Send a Live Like" : "Send a Ping");
    text(
      "#sender-status",
      like
        ? "A compliment without saying a word."
        : "No overthinking the opening line.",
    );
    text(
      "#signal-caption",
      like
        ? "Give a little appreciation. See the little lift. Tap to try it."
        : "You send a little courage. They get butterflies. Tap to try it.",
    );
  };
  const selectMode = (next) => {
    mode = next;
    reset();
    const like = mode === "like";
    demo.dataset.mode = mode;
    choices.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.signal === mode),
      ),
    );
    text("#signal-symbol", like ? "♡" : "✦");
    text(
      "#send-heading",
      like ? "You like their energy." : "You noticed Rhea.",
    );
    text(
      "#receive-heading",
      like ? "A compliment. Out of nowhere." : "That “wait, me?” feeling.",
    );
    text(
      "#receive-notice",
      like ? "Alex sent you a Live Like." : "You got a Ping from Alex.",
    );
    text(
      "#receive-detail",
      like
        ? "You made an impression. No reply needed."
        : "Someone wants to say hello. Your move.",
    );
    text(
      "#receiver-feeling",
      like
        ? "A little confidence boost. Just because."
        : "Someone noticed you. Let that sink in.",
    );
    document.querySelector("#receiver-options").hidden = like;
    text(".travelling-signal", like ? "♡" : "✦");
  };
  const send = () => {
    reset();
    sendButton.disabled = true;
    // Restart only this finite, local animation. Never contact the app or signup API.
    void demo.offsetWidth;
    demo.classList.add("sending");
    text(
      "#signal-button-text",
      mode === "like" ? "Sending Like…" : "Sending Ping…",
    );
    text("#signal-caption", "A little good energy, on its way…");
    const finish = () => {
      demo.classList.remove("sending");
      demo.classList.add("received");
      sendButton.disabled = false;
      text(
        "#signal-button-text",
        mode === "like" ? "Like sent ✓ · again?" : "Ping sent ✓ · again?",
      );
      text(
        "#sender-status",
        mode === "like"
          ? "You gave someone a little lift."
          : "You did it. The ice is broken.",
      );
      text(
        "#signal-caption",
        mode === "like"
          ? "Like sent. Smile received. No conversation required. (Demo)"
          : "Ping received. That little rush, on both sides. Their choice comes next. (Demo)",
      );
    };
    if (reduced()) finish();
    else timer = setTimeout(finish, 1100);
  };
  choices.forEach((button) =>
    button.addEventListener("click", () => selectMode(button.dataset.signal)),
  );
  sendButton.addEventListener("click", send);
  document.querySelector("#replay-signal").addEventListener("click", send);
  document.querySelector("#try-live-like").addEventListener("click", () => {
    selectMode("like");
    demo.scrollIntoView({
      behavior: reduced() ? "instant" : "smooth",
      block: "center",
    });
    sendButton.focus({ preventScroll: true });
    send();
  });
  // Play once when the two-sided moment comes into view; scrolling never traps the visitor.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          if (
            !demo.classList.contains("received") &&
            !demo.classList.contains("sending") &&
            !reduced()
          )
            send();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(demo);
  }
  window.addEventListener("pagehide", () => clearTimeout(timer));
})();

(() => {
  const form = document.querySelector("#waitlist-form");
  const formCard = document.querySelector(".form-card");
  const status = document.querySelector("#form-status");
  const successState = document.querySelector("#success-state");
  const submitButton = document.querySelector(".form-submit");
  const localFile =
    typeof window !== "undefined" && window.location.protocol === "file:";
  const previewNote = document.querySelector("#preview-note");
  if (previewNote && localFile) previewNote.hidden = false;

  if (!form || !formCard || !status || !successState || !submitButton) return;

  const fields = ["name", "phone", "email", "reason", "suggestions"];

  const getField = (name) => form.elements.namedItem(name);

  const setError = (name, message) => {
    const input = getField(name);
    const field = input?.closest(".field");
    const error = form.querySelector(`[data-error-for="${name}"]`);

    field?.classList.toggle("has-error", Boolean(message));
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message || "";
  };

  const clearErrors = () => fields.forEach((name) => setError(name, ""));

  const validate = (values) => {
    const errors = {};
    const name = values.name.trim();
    const phone = values.phone.trim();
    const email = values.email.trim();
    const reason = values.reason.trim();
    const suggestions = String(values.suggestions || "").trim();
    const digits = phone.replace(/\D/g, "");

    if (name.length < 2 || name.length > 80)
      errors.name = "Please enter a name between 2 and 80 characters.";
    if (digits.length < 7 || digits.length > 20 || phone.length > 30)
      errors.phone = "Please enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160)
      errors.email = "Please enter a valid email.";
    if (reason.length < 5 || reason.length > 1000)
      errors.reason = "Tell us a little more — one sentence is perfect.";
    if (suggestions.length > 1000)
      errors.suggestions = "Keep your ideas under 1,000 characters.";

    return errors;
  };

  const setStatus = (message, kind = "error") => {
    status.textContent = message;
    status.classList.toggle("is-success", kind === "success");
  };

  fields.forEach((name) => {
    getField(name)?.addEventListener("input", () => setError(name, ""));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;
    clearErrors();
    setStatus("");

    const values = Object.fromEntries(new FormData(form).entries());
    const errors = validate(values);

    Object.entries(errors).forEach(([name, message]) =>
      setError(name, message),
    );
    if (Object.keys(errors).length > 0) {
      const firstInvalid = getField(Object.keys(errors)[0]);
      firstInvalid?.focus();
      return;
    }
    if (localFile) {
      setStatus(
        "This is a design preview. Signup will work on the deployed waitlist website.",
      );
      return;
    }

    // Quietly discard obvious bot submissions without revealing the honeypot.
    if (String(values.website || "").trim()) return;

    formCard.classList.add("is-submitting");
    submitButton.disabled = true;
    setStatus("Saving your spot…");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/waitlist", {
        signal: controller.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim().toLowerCase(),
          reason: values.reason.trim(),
          suggestions: String(values.suggestions || "").trim(),
          website: values.website || "",
        }),
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch {
        // A non-JSON response is handled by the generic error below.
      }

      if (!response.ok) {
        if (payload.fields)
          Object.entries(payload.fields).forEach(([name, message]) => {
            if (fields.includes(name)) setError(name, message);
          });
        const error = new Error(
          payload.error || "Something went wrong. Please try again.",
        );
        error.status = response.status;
        throw error;
      }
      if (payload.ok !== true)
        throw new Error("We couldn’t confirm your signup. Please try again.");

      form.hidden = true;
      status.hidden = true;
      successState.hidden = false;
      successState.focus({ preventScroll: true });
      successState.scrollIntoView({
        behavior: document.documentElement.classList.contains("motion-paused")
          ? "instant"
          : "smooth",
        block: "center",
      });
    } catch (error) {
      const message =
        error.status === 409
          ? "That email is already on the list — we have your details."
          : error.name === "AbortError"
            ? "That took too long. Your signup may have saved; retry to check."
            : error.message ||
              "We could not save that just now. Please try again.";
      setStatus(message);
      submitButton.disabled = false;
    } finally {
      clearTimeout(timeout);
      formCard.classList.remove("is-submitting");
    }
  });
})();
