/* ============================================================
   SignForge — license.js
   Deterministic offline license keys.

   key(email) = first 8 hex chars (uppercase, formatted
   XXXX-XXXX) of the FNV-1a 32-bit hash of:
       "signforge-salt-v1" + normalizedEmail
   where normalizedEmail = trim + lowercase.

   The owner generates keys with license-gen.html and emails
   them to customers after the Stripe payment. No backend is
   ever required — validation happens entirely in the browser.
   ============================================================ */

(function () {
  "use strict";

  var SALT = "signforge-salt-v1";

  /* FNV-1a, 32-bit. Math.imul keeps the multiplication exact in 32 bits. */
  function fnv1a32(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  /* The canonical license key for an email address. */
  function computeKey(email) {
    var hex = fnv1a32(SALT + normalizeEmail(email)).toString(16);
    while (hex.length < 8) hex = "0" + hex;
    hex = hex.toUpperCase();
    return hex.slice(0, 4) + "-" + hex.slice(4, 8);
  }

  /* Clean user input: strip spaces/dashes, keep hex, format XXXX-XXXX. */
  function formatKey(raw) {
    var clean = String(raw || "").replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
    if (clean.length < 8) return null;
    return clean.slice(0, 4) + "-" + clean.slice(4, 8);
  }

  function validate(email, key) {
    var formatted = formatKey(key);
    if (!formatted) return false;
    return formatted === computeKey(email);
  }

  window.SF_LICENSE = {
    computeKey: computeKey,
    validate: validate,
    formatKey: formatKey,
    normalizeEmail: normalizeEmail
  };
})();
