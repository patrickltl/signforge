/* ============================================================
   SignForge — app.js
   Builder form, live preview, template gallery, rich-HTML copy,
   .html download, per-client install guides, localStorage saves,
   licensing gate and demo unlock. No frameworks, no build step.
   ============================================================ */

(function () {
  "use strict";

  var LICENSE_KEY_STORAGE = "signforge_license";
  var SAVED_KEY_STORAGE = "signforge_saved";
  var GMAIL_CHAR_LIMIT = 10000;
  var DEFAULT_ACCENT = "#7C3AED";

  var NETWORKS = [
    { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/you" },
    { id: "x", label: "X", placeholder: "https://x.com/you" },
    { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/you" },
    { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@you" },
    { id: "github", label: "GitHub", placeholder: "https://github.com/you" }
  ];

  var CLIENT_NOTES = {
    preview: "Exact rendering of your signature HTML. This markup is exactly what gets copied, downloaded and pasted into your email client.",
    gmail: "Gmail renders table-based HTML reliably. Signature HTML is capped at 10,000 characters (your count is shown below the preview). In dark mode Gmail may dim or invert colors to match its theme \u2014 always send yourself a test email.",
    outlook: "Classic Outlook on Windows renders email through Microsoft Word, which ignores modern CSS. This template uses only tables, inline styles and web-safe fonts, so the hierarchy stays intact. Rounded corners degrade to squares in Outlook \u2014 by design, never broken. Dark mode may shift colors.",
    apple: "Apple Mail renders modern HTML well, including border radius on images. If macOS is set to dark mode, Apple Mail may automatically adjust colors of text and backgrounds \u2014 send yourself a test message to confirm contrast still reads well."
  };

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  /* ---------------- storage helpers ---------------- */

  function storeGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function storeSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  /* ---------------- licensing ---------------- */

  function loadLicense() { return storeGet(LICENSE_KEY_STORAGE, null); }

  function isLicensed() {
    var lic = loadLicense();
    if (!lic) return false;
    if (lic.type === "pro" && lic.email && lic.key) return true;
    if (lic.type === "demo" && typeof lic.expires === "number") return Date.now() < lic.expires;
    return false;
  }

  function activateDemo() {
    return storeSet(LICENSE_KEY_STORAGE, {
      type: "demo",
      activatedAt: Date.now(),
      expires: Date.now() + 24 * 60 * 60 * 1000
    });
  }

  function activatePro(email, key) {
    return storeSet(LICENSE_KEY_STORAGE, {
      type: "pro",
      email: email,
      key: key,
      activatedAt: Date.now()
    });
  }

  function requirePro(action) {
    if (isLicensed()) { action(); } else { openModal("unlockModal"); }
  }

  /* ---------------- form <-> data ---------------- */

  function readForm() {
    return {
      name: $("#f-name").value.trim(),
      role: $("#f-role").value.trim(),
      company: $("#f-company").value.trim(),
      phone: $("#f-phone").value.trim(),
      mobile: $("#f-mobile").value.trim(),
      email: $("#f-email").value.trim(),
      website: $("#f-website").value.trim(),
      address: $("#f-address").value.trim(),
      headshot: $("#f-headshot").value.trim(),
      logo: $("#f-logo").value.trim(),
      banner: $("#f-banner").value.trim(),
      disclaimer: $("#f-disclaimer").value.trim(),
      accent: normalizeAccent($("#f-accent").value),
      socials: readSocialRows()
    };
  }

  function normalizeAccent(value) {
    var v = String(value || "").trim();
    return /^#[0-9A-Fa-f]{6}$/.test(v) ? v : DEFAULT_ACCENT;
  }

  function fillForm(data) {
    var map = {
      "f-name": "name", "f-role": "role", "f-company": "company",
      "f-phone": "phone", "f-mobile": "mobile", "f-email": "email",
      "f-website": "website", "f-address": "address",
      "f-headshot": "headshot", "f-logo": "logo",
      "f-banner": "banner", "f-disclaimer": "disclaimer"
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = data[map[id]] || "";
    });
    var accent = normalizeAccent(data.accent);
    $("#f-accent").value = accent;
    $("#f-accent-hex").value = accent.toUpperCase();
    clearSocialRows();
    var socials = data.socials && data.socials.length ? data.socials : [{ network: "linkedin", url: "" }];
    for (var i = 0; i < socials.length; i++) addSocialRow(socials[i].network, socials[i].url);
  }

  /* ---------------- social rows ---------------- */

  function networkOptions(selected) {
    var html = "";
    for (var i = 0; i < NETWORKS.length; i++) {
      var n = NETWORKS[i];
      html += '<option value="' + n.id + '"' + (n.id === selected ? " selected" : "") + '>' + n.label + "</option>";
    }
    return html;
  }

  function addSocialRow(network, url) {
    var row = document.createElement("div");
    row.className = "social-row";
    row.innerHTML =
      '<select class="social-net" aria-label="Social network">' + networkOptions(network || "linkedin") + "</select>" +
      '<input type="url" class="social-url" inputmode="url" placeholder="https://linkedin.com/in/you" aria-label="Social URL" />' +
      '<button type="button" class="icon-btn social-remove" title="Remove link" aria-label="Remove social link">&times;</button>';
    row.querySelector(".social-url").value = url || "";
    row.querySelector(".social-remove").addEventListener("click", function () {
      row.parentNode.removeChild(row);
      scheduleRender();
    });
    row.addEventListener("input", scheduleRender);
    row.addEventListener("change", scheduleRender);
    $("#socialRows").appendChild(row);
  }

  function clearSocialRows() {
    var box = $("#socialRows");
    while (box.firstChild) box.removeChild(box.firstChild);
  }

  function readSocialRows() {
    var out = [];
    $all("#socialRows .social-row").forEach(function (row) {
      var network = row.querySelector(".social-net").value;
      var url = row.querySelector(".social-url").value.trim();
      if (url) out.push({ network: network, url: url });
    });
    return out;
  }

  /* ---------------- template cards ---------------- */

  function buildTemplateCards() {
    var gallery = $("#galleryCards");
    var builder = $("#templateCards");
    for (var i = 0; i < window.SF_TEMPLATES.length; i++) {
      var t = window.SF_TEMPLATES[i];
      gallery.appendChild(makeCard(t, "gallery"));
      builder.appendChild(makeCard(t, "builder"));
    }
  }

  function makeCard(t, context) {
    var card = document.createElement("div");
    card.className = "tcard";
    card.setAttribute("data-template", t.id);
    card.innerHTML =
      '<div class="tmini" role="img" aria-label="Preview of the ' + t.name + ' signature template">' +
        '<div class="tmini-inner"></div>' +
        '<div class="tlock"><span class="chip chip-lock">PRO</span><span class="tlock-text">Unlock to use</span></div>' +
      "</div>" +
      '<div class="tmeta">' +
        "<div>" +
          '<div class="tname">' + t.name + (t.pro ? ' <span class="chip chip-mini">PRO</span>' : "") + "</div>" +
          '<div class="tdesc">' + t.tagline + "</div>" +
        "</div>" +
        '<button type="button" class="btn btn-small ' + (t.pro ? "btn-ghost" : "btn-primary") + ' tselect">' + (t.pro ? "Unlock" : "Use") + "</button>" +
      "</div>";

    function onPick(e) {
      e.preventDefault();
      if (t.pro && !isLicensed()) { openModal("unlockModal"); return; }
      selectTemplate(t.id);
      if (context === "gallery") {
        document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
      }
    }
    card.querySelector(".tselect").addEventListener("click", onPick);
    card.querySelector(".tmini").addEventListener("click", onPick);
    return card;
  }

  function renderCardMinis(data) {
    var licensed = isLicensed();
    $all(".tcard").forEach(function (card) {
      var t = window.SF_TEMPLATE_MAP[card.getAttribute("data-template")];
      var mini = card.querySelector(".tmini-inner");
      if (mini) mini.innerHTML = window.SF_renderSignature(t.id, data, licensed);
      card.classList.toggle("locked", !!(t.pro && !licensed));
      card.classList.toggle("active", t.id === state.templateId);
      var btn = card.querySelector(".tselect");
      if (btn) btn.textContent = t.pro && !licensed ? "Unlock" : (t.id === state.templateId ? "Selected" : "Use");
      if (btn) btn.classList.toggle("btn-primary", t.id === state.templateId || !(t.pro && !licensed));
      if (btn) btn.classList.toggle("btn-ghost", !!(t.pro && !licensed));
    });
  }

  function selectTemplate(id) {
    state.templateId = id;
    renderAll();
  }

  /* ---------------- rendering pipeline ---------------- */

  var state = { templateId: "aurora", clientTab: "preview" };

  var renderPending = false;
  function scheduleRender() {
    if (renderPending) return;
    renderPending = true;
    /* Fast path: next animation frame. */
    requestAnimationFrame(function () {
      if (!renderPending) return;
      renderPending = false;
      renderAll();
    });
    /* Safety net: RAF is throttled or paused in background tabs, so a
       short timer guarantees the preview still catches up. */
    setTimeout(function () {
      if (!renderPending) return;
      renderPending = false;
      renderAll();
    }, 120);
  }

  function currentSignature() {
    return window.SF_renderSignature(state.templateId, readForm(), isLicensed());
  }

  function renderAll() {
    var data = readForm();
    var licensed = isLicensed();

    /* main preview */
    var sig = window.SF_renderSignature(state.templateId, data, licensed);
    $("#previewCard").innerHTML = sig;

    var t = window.SF_TEMPLATE_MAP[state.templateId];
    $("#previewTemplateName").textContent = t.name + (t.pro ? " \u00b7 Pro template" : " \u00b7 Free template");

    var chars = sig.length;
    var counter = $("#charCount");
    counter.textContent = chars.toLocaleString("en-US") + " / " + GMAIL_CHAR_LIMIT.toLocaleString("en-US") + " characters (Gmail signature limit)";
    counter.classList.toggle("over-limit", chars > GMAIL_CHAR_LIMIT);

    /* client note */
    $("#clientNote").textContent = CLIENT_NOTES[state.clientTab] || CLIENT_NOTES.preview;

    /* gallery + builder minis */
    renderCardMinis(data);
  }

  function setClientTab(tab) {
    state.clientTab = tab;
    $all(".ptab").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-client") === tab);
      btn.setAttribute("aria-pressed", btn.getAttribute("data-client") === tab ? "true" : "false");
    });
    $("#clientNote").textContent = CLIENT_NOTES[tab] || CLIENT_NOTES.preview;
  }

  /* ---------------- rich HTML copy (the critical part) ---------------- */

  function plainTextOf(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  /* Fallback: render the HTML into a hidden contentEditable node,
     select it and copy via execCommand — this copies FORMATTED
     (rich) HTML to the clipboard, not the markup string. */
  function fallbackCopyRich(html) {
    var container = document.createElement("div");
    container.setAttribute("contenteditable", "true");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.opacity = "0";
    container.innerHTML = html;
    document.body.appendChild(container);

    var range = document.createRange();
    range.selectNodeContents(container);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }

    sel.removeAllRanges();
    if (container.parentNode) container.parentNode.removeChild(container);
    return ok;
  }

  function copyViaClipboardApi(sig) {
    /* Race a short timeout: on some setups (headless, odd permission
       states, older clients) clipboard.write can stall instead of
       rejecting — we must fall back instead of hanging. */
    var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(false); }, 2500); });
    var attempt = navigator.clipboard.write([new window.ClipboardItem({
      "text/html": new Blob([sig], { type: "text/html" }),
      "text/plain": new Blob([plainTextOf(sig)], { type: "text/plain" })
    })]).then(function () { return true; }).catch(function () { return false; });
    return Promise.race([attempt, timeout]);
  }

  async function copySignature() {
    var sig = currentSignature();
    var copied = false;
    try {
      if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
        copied = await copyViaClipboardApi(sig);
      }
    } catch (e) { copied = false; }
    if (!copied) copied = fallbackCopyRich(sig);

    var btn = $("#copyBtn");
    if (copied) {
      btn.textContent = "Copied!";
      toast("Signature copied as rich HTML \u2014 paste it into your email client's signature box.");
    } else {
      toast("Automatic copy failed. Use \u201cDownload .html\u201d, open the file, select all and copy.", true);
    }
    setTimeout(function () { btn.textContent = "Copy signature"; }, 1800);
  }

  /* ---------------- download .html ---------------- */

  function downloadSignature() {
    var sig = currentSignature();
    var t = window.SF_TEMPLATE_MAP[state.templateId];
    var doc = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
      "<title>Email signature \u2014 " + t.name + " (SignForge)</title>\n</head>\n" +
      "<body style=\"margin:0;padding:24px;background:#FFFFFF;font-family:Arial,Helvetica,sans-serif;\">\n" +
      sig + "\n" +
      "<p style=\"font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#94A3B8;margin-top:32px;\">" +
      "Select everything above this line (Ctrl/Cmd+A picks the whole page \u2014 or drag-select the signature), copy, then paste into your email client's signature settings. See the install guides on the site for step-by-step instructions.</p>\n" +
      "</body>\n</html>";

    var blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "signforge-signature-" + t.id + ".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    toast("Downloaded signforge-signature-" + t.id + ".html");
  }

  /* ---------------- saved signatures (pro) ---------------- */

  function getSaved() { return storeGet(SAVED_KEY_STORAGE, []); }

  function saveCurrent() {
    requirePro(function () {
      var data = readForm();
      var t = window.SF_TEMPLATE_MAP[state.templateId];
      var entry = {
        id: "sig_" + Date.now().toString(36),
        label: (data.name || "Untitled") + " \u2014 " + t.name,
        template: state.templateId,
        data: data,
        savedAt: Date.now()
      };
      var list = getSaved();
      list.unshift(entry);
      storeSet(SAVED_KEY_STORAGE, list);
      renderSaved();
      toast("Signature saved in this browser.");
    });
  }

  function loadSaved(id) {
    var entry = null;
    var list = getSaved();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) entry = list[i];
    if (!entry) return;
    fillForm(entry.data);
    state.templateId = entry.template;
    renderAll();
    toast("Loaded \u201c" + entry.label + "\u201d.");
  }

  function duplicateSaved(id) {
    requirePro(function () {
      var list = getSaved();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
          var copy = JSON.parse(JSON.stringify(list[i]));
          copy.id = "sig_" + Date.now().toString(36);
          copy.label = list[i].label + " (copy)";
          copy.savedAt = Date.now();
          list.splice(i + 1, 0, copy);
          break;
        }
      }
      storeSet(SAVED_KEY_STORAGE, list);
      renderSaved();
      toast("Duplicated.");
    });
  }

  function deleteSaved(id) {
    var list = getSaved().filter(function (e) { return e.id !== id; });
    storeSet(SAVED_KEY_STORAGE, list);
    renderSaved();
    toast("Deleted.");
  }

  function renderSaved() {
    var list = getSaved();
    var box = $("#savedList");
    box.innerHTML = "";
    if (!list.length) {
      box.innerHTML = '<p class="saved-empty">No saved signatures yet. Fill the form, then press \u201cSave signature\u201d.</p>';
      return;
    }
    for (var i = 0; i < list.length; i++) {
      (function (entry) {
        var item = document.createElement("div");
        item.className = "saved-item";
        item.innerHTML =
          '<div class="saved-label">' + escapeHtml(entry.label) + "</div>" +
          '<div class="saved-actions">' +
            '<button type="button" class="btn btn-tiny btn-ghost js-load">Load</button>' +
            '<button type="button" class="btn btn-tiny btn-ghost js-dup">Duplicate</button>' +
            '<button type="button" class="btn btn-tiny btn-danger js-del">Delete</button>' +
          "</div>";
        item.querySelector(".js-load").addEventListener("click", function () { loadSaved(entry.id); });
        item.querySelector(".js-dup").addEventListener("click", function () { duplicateSaved(entry.id); });
        item.querySelector(".js-del").addEventListener("click", function () { deleteSaved(entry.id); });
        box.appendChild(item);
      })(list[i]);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------------- gate ---------------- */

  function applyGate() {
    var licensed = isLicensed();

    $("#f-banner").disabled = !licensed;
    $("#f-disclaimer").disabled = !licensed;

    var upsell = $("#upsellCard");
    if (upsell) upsell.hidden = licensed;

    var navUnlock = $("#navUnlock");
    if (navUnlock) navUnlock.hidden = licensed;

    var proNote = $("#proActiveNote");
    if (proNote) proNote.hidden = !licensed;

    renderAll();
  }

  /* ---------------- modals ---------------- */

  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
    var focusable = m.querySelector("input, button, select, textarea");
    if (focusable) focusable.focus();
  }

  function closeModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
  }

  function wireModals() {
    $all(".modal").forEach(function (m) {
      m.addEventListener("click", function (e) {
        if (e.target === m) closeModal(m.id);
      });
      var close = m.querySelector(".modal-close");
      if (close) close.addEventListener("click", function () { closeModal(m.id); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") $all(".modal.open").forEach(function (m) { closeModal(m.id); });
    });
  }

  /* ---------------- toast ---------------- */

  var toastTimer = null;
  function toast(message, isError) {
    var el = $("#toast");
    el.textContent = message;
    el.classList.toggle("error", !!isError);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3600);
  }

  /* ---------------- unlock flow ---------------- */

  function wireUnlock() {
    $("#unlockForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("#unlockEmail").value;
      var key = $("#unlockKey").value;
      var err = $("#unlockError");
      if (window.SF_LICENSE.validate(email, key)) {
        activatePro(window.SF_LICENSE.normalizeEmail(email), window.SF_LICENSE.formatKey(key));
        applyGate();
        closeModal("unlockModal");
        err.hidden = true;
        $("#unlockForm").reset();
        toast("License activated \u2014 all 8 templates, banner, disclaimer and saved signatures unlocked.");
      } else {
        err.textContent = "That email and license key don't match. Keys look like XXXX-XXXX \u2014 check the email we sent you, then try again.";
        err.hidden = false;
      }
    });

    $all(".js-upgrade").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (!SITE_CONFIG.stripePaymentLink || SITE_CONFIG.stripePaymentLink.indexOf("PASTE_YOUR") === 0) {
          e.preventDefault();
          toast("Owner setup: paste your Stripe payment link into js/config.js (see README.md).", true);
        }
      });
    });

    $("#demoBtn").addEventListener("click", function () {
      activateDemo();
      applyGate();
      closeModal("unlockModal");
      toast("24-hour demo unlocked. Every template, banner and saved signatures are live \u2014 no key needed.");
    });
  }

  /* ---------------- hero showcase ---------------- */

  /* Static sample data for the hero showcase signature. Rendered with
     licensed=true so the hero shows the clean, badge-free look. */
  var SAMPLE_DATA = {
    name: "Ava Chen",
    role: "Product Designer",
    company: "Northwind Studio",
    phone: "+1 (555) 010-2030",
    mobile: "",
    email: "ava@northwind.studio",
    website: "northwind.studio",
    address: "88 Harbor Lane, Portland, OR",
    headshot: "",
    logo: "",
    banner: "",
    disclaimer: "",
    accent: "#7C3AED",
    socials: [
      { network: "linkedin", url: "https://linkedin.com/in/avachen" },
      { network: "x", url: "https://x.com/avachen" },
      { network: "instagram", url: "https://instagram.com/ava.chen" }
    ]
  };

  function renderHeroSample() {
    var hero = document.getElementById("heroSig");
    if (hero) hero.innerHTML = window.SF_renderSignature("aurora", SAMPLE_DATA, true);
  }

  /* ---------------- config application ---------------- */

  function applyConfig() {
    $all(".js-brand").forEach(function (el) { el.textContent = SITE_CONFIG.brandName; });
    $all(".js-price").forEach(function (el) { el.textContent = SITE_CONFIG.price; });
    $all(".js-upgrade").forEach(function (el) {
      if (SITE_CONFIG.stripePaymentLink && SITE_CONFIG.stripePaymentLink.indexOf("PASTE_YOUR") !== 0) {
        el.setAttribute("href", SITE_CONFIG.stripePaymentLink);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
      }
    });
  }

  /* ---------------- init ---------------- */

  function wireEvents() {
    $all("#builderForm input, #builderForm textarea").forEach(function (el) {
      el.addEventListener("input", scheduleRender);
    });

    /* accent picker <-> hex field sync */
    $("#f-accent").addEventListener("input", function () {
      $("#f-accent-hex").value = $("#f-accent").value.toUpperCase();
      scheduleRender();
    });
    $("#f-accent-hex").addEventListener("change", function () {
      var v = normalizeAccent($("#f-accent-hex").value);
      $("#f-accent-hex").value = v.toUpperCase();
      $("#f-accent").value = v;
      scheduleRender();
    });

    $("#addSocial").addEventListener("click", function () { addSocialRow("", ""); });

    $all(".ptab").forEach(function (btn) {
      btn.addEventListener("click", function () { setClientTab(btn.getAttribute("data-client")); });
    });

    $("#copyBtn").addEventListener("click", copySignature);
    $("#downloadBtn").addEventListener("click", downloadSignature);
    $("#guideBtn").addEventListener("click", function () { openModal("guidesModal"); });

    $("#saveBtn").addEventListener("click", saveCurrent);
    $("#unlockOpenBtn").addEventListener("click", function () { openModal("unlockModal"); });
    $("#navUnlock").addEventListener("click", function () { openModal("unlockModal"); });

    wireModals();
    wireUnlock();
  }

  function handleDemoParam() {
    if (location.search.indexOf("demo=1") !== -1) {
      activateDemo();
      applyGate();
      toast("24-hour demo unlocked \u2014 all pro features are live until " + new Date(loadLicense().expires).toLocaleString() + ".");
    }
  }

  function init() {
    applyConfig();
    buildTemplateCards();
    addSocialRow("linkedin", "");
    wireEvents();
    handleDemoParam();
    applyGate();
    setClientTab("preview");
    renderSaved();
    renderHeroSample();
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
