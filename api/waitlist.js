const MAX_BODY_LENGTH = 12_000;

const send = (res, status, payload) => {
  res
    .status(status)
    .setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(payload));
};

const stringValue = (value) => (typeof value === "string" ? value.trim() : "");

const readBody = (body) => {
  if (body && typeof body === "object") return body;
  if (typeof body === "string" && body.length <= MAX_BODY_LENGTH) {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return null;
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Method not allowed." });
  }

  const body = readBody(req.body);
  if (!body || JSON.stringify(body).length > MAX_BODY_LENGTH) {
    return send(res, 400, { error: "Please send the form again." });
  }

  // This field is never stored. A filled honeypot is treated as a successful no-op.
  if (stringValue(body.website)) return send(res, 202, { ok: true });

  const signup = {
    name: stringValue(body.name),
    phone: stringValue(body.phone),
    email: stringValue(body.email).toLowerCase(),
    reason: stringValue(body.reason),
  };

  const digits = signup.phone.replace(/\D/g, "");
  const suggestions = stringValue(body.suggestions);
  const errors = {};

  if (signup.name.length < 2 || signup.name.length > 80)
    errors.name = "Enter a name between 2 and 80 characters.";
  if (digits.length < 7 || digits.length > 20 || signup.phone.length > 30)
    errors.phone = "Enter a valid phone number.";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signup.email) ||
    signup.email.length > 160
  )
    errors.email = "Enter a valid email address.";
  if (signup.reason.length < 5 || signup.reason.length > 1000)
    errors.reason = "Tell us a little more about why you are interested.";
  if (
    (body.suggestions != null && typeof body.suggestions !== "string") ||
    suggestions.length > 1000
  )
    errors.suggestions = "Keep your ideas under 1,000 characters.";

  if (Object.keys(errors).length > 0)
    return send(res, 400, {
      error: "Please check the highlighted fields.",
      fields: errors,
    });

  const supabaseUrl = stringValue(process.env.SUPABASE_URL).replace(/\/$/, "");
  const serviceRoleKey = stringValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const webhookUrl = stringValue(process.env.WAITLIST_WEBHOOK_URL);

  if (!webhookUrl && (!supabaseUrl || !serviceRoleKey)) {
    return send(res, 503, {
      error: "The waitlist is not configured yet. Please try again soon.",
    });
  }

  try {
    if (webhookUrl) {
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...signup,
          ...(suggestions ? { suggestions } : {}),
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok)
        throw new Error("Waitlist webhook rejected the submission.");
    } else {
      const response = await fetch(`${supabaseUrl}/rest/v1/waitlist_signups`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        // Keep the deployed table compatible: preserve both answers in its existing
        // free-text reason column. No new column or production migration required.
        body: JSON.stringify({
          ...signup,
          reason: suggestions
            ? `${signup.reason}\n\nFeature suggestions:\n${suggestions}`
            : signup.reason,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        if (
          response.status === 409 ||
          responseText.includes("23505") ||
          responseText.includes("duplicate key")
        ) {
          return send(res, 409, {
            error: "That email is already on the list.",
          });
        }
        throw new Error("Supabase rejected the submission.");
      }
    }

    return send(res, 201, { ok: true });
  } catch {
    // Do not return provider details or personal data to the browser.
    return send(res, 502, {
      error: "We could not save that just now. Please try again.",
    });
  }
};
