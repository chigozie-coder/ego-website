const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const rateBuckets = new Map();

function sendJson(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(payload));
}

function cleanText(value, limit) {
  return typeof value === "string" ? value.replace(/\r/g, "").trim().slice(0, limit) : "";
}

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const address = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || "").split(",")[0];
  return cleanText(address || req.socket?.remoteAddress || "unknown", 100);
}

function allowRequest(key, now = Date.now()) {
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_LIMIT) return false;
  current.count += 1;
  return true;
}

module.exports = async function contactHandler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { message: "This contact form accepts messages only." });
  }

  const host = String(req.headers.host || "").toLowerCase();
  const origin = String(req.headers.origin || "");
  if (origin) {
    try {
      if (new URL(origin).host.toLowerCase() !== host) {
        return sendJson(res, 403, { message: "Please submit this form from the website." });
      }
    } catch {
      return sendJson(res, 403, { message: "Please submit this form from the website." });
    }
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > 10_000) {
    return sendJson(res, 413, { message: "That message is too large. Please shorten it and try again." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return sendJson(res, 400, { message: "Please check the form and try again." });
  }
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > 10_000) {
    return sendJson(res, 413, { message: "That message is too large. Please shorten it and try again." });
  }

  if (cleanText(body.website, 100)) {
    return sendJson(res, 200, { message: "Thank you — your note is on its way." });
  }
  if (!allowRequest(getClientKey(req))) {
    return sendJson(res, 429, { message: "Please wait a little before sending another note." });
  }

  const name = cleanText(body.name, 80);
  const email = cleanText(body.email, 254).toLowerCase();
  const message = cleanText(body.message, 2000);
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (name.length < 2 || !emailIsValid || message.length < 5) {
    return sendJson(res, 400, { message: "Please enter your name, a valid email, and a message of at least five characters." });
  }

  const apiKey = process.env.SENDBYTE_API_KEY;
  const recipient = process.env.CONTACT_TO_EMAIL;
  const sender = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) {
    return sendJson(res, 503, { message: "The contact service is being set up. Please try again later." });
  }

  try {
    const delivery = await fetch("https://api.sendbyte.africa/v1/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: email,
        subject: "A new note for Ego from " + name,
        text: "Name: " + name + "\nEmail: " + email + "\n\nMessage:\n" + message,
      }),
    });
    if (!delivery.ok) {
      console.error("Contact delivery failed with status", delivery.status);
      return sendJson(res, 502, { message: "I couldn’t send that just now. Please try again shortly." });
    }
    return sendJson(res, 200, { message: "Thank you — your note is on its way." });
  } catch (error) {
    console.error("Contact delivery failed", error?.name || "unknown error");
    return sendJson(res, 502, { message: "I couldn’t send that just now. Please try again shortly." });
  }
};
