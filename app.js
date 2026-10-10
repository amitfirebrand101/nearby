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
        "A Like is a little appreciation. A Ping says you’d be open to connecting. No walking across the room to put someone on the spot.",
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
        "Want to connect? Choose the Instagram or WhatsApp details you’d like to share. A Ping alone never gives someone access to your socials.",
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
  let pingTimer,
    pingCount = 0;
  const scene = document.querySelector("#play-scene");
  const ping = document.querySelector("#practice-ping");
  const reactions = [
    "Pip noticed you back. A little hello goes a long way.",
    "Good energy, received. Pip’s day = made.",
    "That’s the feeling. Small signal, big smile.",
  ];
  ping?.addEventListener("click", () => {
    clearTimeout(pingTimer);
    scene.classList.remove("pinged");
    void scene.offsetWidth;
    scene.classList.add("pinged");
    document.querySelector("#play-response").textContent =
      reactions[pingCount++ % reactions.length];
    ping.querySelector("span").textContent = "One more little Ping?";
    pingTimer = setTimeout(() => scene.classList.remove("pinged"), 1500);
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

  const fields = ["name", "phone", "email", "reason"];

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
    const digits = phone.replace(/\D/g, "");

    if (name.length < 2 || name.length > 80)
      errors.name = "Please enter a name between 2 and 80 characters.";
    if (digits.length < 7 || digits.length > 20 || phone.length > 30)
      errors.phone = "Please enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160)
      errors.email = "Please enter a valid email.";
    if (reason.length < 5 || reason.length > 1000)
      errors.reason = "Tell us a little more — one sentence is perfect.";

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
