(() => {
  const form = document.querySelector("#waitlist-form");
  const formCard = document.querySelector(".form-card");
  const status = document.querySelector("#form-status");
  const successState = document.querySelector("#success-state");
  const submitButton = document.querySelector(".form-submit");

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

    if (name.length < 2) errors.name = "Please enter your name.";
    if (digits.length < 7 || phone.length > 30) errors.phone = "Please enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email.";
    if (reason.length < 5) errors.reason = "Tell us a little more — one sentence is perfect.";

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
    clearErrors();
    setStatus("");

    const values = Object.fromEntries(new FormData(form).entries());
    const errors = validate(values);

    Object.entries(errors).forEach(([name, message]) => setError(name, message));
    if (Object.keys(errors).length > 0) {
      const firstInvalid = getField(Object.keys(errors)[0]);
      firstInvalid?.focus();
      return;
    }

    // Quietly discard obvious bot submissions without revealing the honeypot.
    if (String(values.website || "").trim()) return;

    formCard.classList.add("is-submitting");
    submitButton.disabled = true;
    setStatus("Saving your spot…");

    try {
      const response = await fetch("/api/waitlist", {
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
        const error = new Error(payload.error || "Something went wrong. Please try again.");
        error.status = response.status;
        throw error;
      }

      form.hidden = true;
      status.hidden = true;
      successState.hidden = false;
      successState.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      const message = error.status === 409
        ? "That email is already on the list — we have your details."
        : error.message || "We could not save that just now. Please try again.";
      setStatus(message);
      submitButton.disabled = false;
    } finally {
      formCard.classList.remove("is-submitting");
    }
  });
})();
