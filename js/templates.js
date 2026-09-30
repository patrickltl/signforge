/* ============================================================
   SignForge — templates.js
   Eight professional HTML email signature templates.

   Every template obeys email-client safety rules:
     - <table> layout only (no flexbox, no grid, no floats)
     - inline styles only (no external CSS, no <style> blocks)
     - web-safe font stacks with fallbacks
     - absolute https:// image URLs only (never embedded/base64)
     - explicit width/height on images so Outlook is predictable
     - graceful degradation when fields are left empty
   ============================================================ */

(function () {
  "use strict";

  var INK = "#0F172A";
  var MUTED = "#475569";
  var FAINT = "#94A3B8";
  var RULE = "#E2E8F0";
  var SANS = "Arial, Helvetica, sans-serif";
  var MONO = "'Courier New', Courier, monospace";

  /* ---------------- shared helpers ---------------- */

  function esc(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function httpize(url) {
    var u = String(url || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    return "https://" + u;
  }

  function domainOf(url) {
    var clean = httpize(url).replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    return clean || String(url || "");
  }

  function telHref(phone) {
    return "tel:" + String(phone).replace(/[^0-9+]/g, "");
  }

  function initialsOf(name) {
    var parts = String(name || "").trim().split(/\s+/);
    var out = "";
    for (var i = 0; i < parts.length && out.length < 2; i++) {
      if (parts[i].charAt(0)) out += parts[i].charAt(0);
    }
    return (out || "S").toUpperCase();
  }

  var SOCIAL_NETWORKS = {
    linkedin: { label: "LinkedIn" },
    x: { label: "X" },
    instagram: { label: "Instagram" },
    youtube: { label: "YouTube" },
    github: { label: "GitHub" }
  };

  function socialsOf(data) {
    var out = [];
    var list = data && data.socials ? data.socials : [];
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (s && s.url && String(s.url).trim()) {
        var meta = SOCIAL_NETWORKS[s.network] || { label: s.network || "Link" };
        out.push({ label: meta.label, url: httpize(s.url) });
      }
    }
    return out;
  }

  /* Text-style social links: the most reliable option across clients
     (icon images need hosting and get blocked in many clients). */
  function socialsHtml(data, accent) {
    var links = socialsOf(data);
    if (!links.length) return "";
    var parts = [];
    for (var i = 0; i < links.length; i++) {
      parts.push(
        '<a href="' + esc(links[i].url) + '" target="_blank" style="color:' + accent + ';text-decoration:none;font-weight:bold;">' + esc(links[i].label) + '</a>'
      );
    }
    return parts.join('<span style="color:' + RULE + ';">&nbsp;&middot;&nbsp;</span>');
  }

  function contactItems(d) {
    var items = [];
    if (d.phone) items.push({ text: d.phone, href: telHref(d.phone) });
    if (d.mobile) items.push({ text: d.mobile, href: telHref(d.mobile) });
    if (d.email) items.push({ text: d.email, href: "mailto:" + d.email });
    if (d.website) items.push({ text: domainOf(d.website), href: httpize(d.website) });
    return items;
  }

  function linkItem(item, accent) {
    return '<a href="' + esc(item.href) + '" style="color:' + MUTED + ';text-decoration:none;">' + esc(item.text) + '</a>';
  }

  /* Contacts on one line, separated by a soft dot. */
  function inlineContacts(d) {
    var items = contactItems(d);
    var bits = [];
    for (var i = 0; i < items.length; i++) bits.push(linkItem(items[i]));
    if (d.address) bits.push(esc(d.address));
    if (!bits.length) return "";
    return bits.join('<span style="color:' + RULE + ';">&nbsp;&middot;&nbsp;</span>');
  }

  /* Stacked contact lines (each on its own row). */
  function stackedContacts(d, color) {
    var items = contactItems(d);
    var bits = [];
    for (var i = 0; i < items.length; i++) bits.push(linkItem(items[i], color));
    if (!bits.length) return "";
    return bits.join('<br />');
  }

  function image(src, width, height, alt, radius) {
    var style = "display:block;width:" + width + "px;height:" + height + "px;border:0;";
    if (radius) style += "border-radius:" + radius + "px;";
    return '<img src="' + esc(httpize(src)) + '" width="' + width + '" height="' + height + '" alt="' + esc(alt || "") + '" style="' + style + '" />';
  }

  /* ---------------- pro append-ons + free badge ---------------- */

  function bannerHtml(d) {
    if (!d.banner) return "";
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr><td>' +
      image(d.banner, 480, 120, "", 0) +
      '</td></tr></table>';
  }

  function disclaimerHtml(d) {
    var t = String(d.disclaimer || "").trim();
    if (!t) return "";
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;"><tr>' +
      '<td style="font-family:' + SANS + ';font-size:10px;line-height:15px;color:' + FAINT + ';">' + esc(t) + '</td>' +
      '</tr></table>';
  }

  /* Appended to every free signature. Small, honest, tasteful. */
  function badgeHtml() {
    var brand = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.brandName) ? SITE_CONFIG.brandName : "SignForge";
    var url = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.siteUrl) ? SITE_CONFIG.siteUrl : "#";
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;"><tr>' +
      '<td style="font-family:' + SANS + ';font-size:9px;line-height:14px;color:' + FAINT + ';">' +
      'Made with <a href="' + esc(url) + '" style="color:' + FAINT + ';text-decoration:underline;">' + esc(brand) + '</a>' +
      '</td></tr></table>';
  }

  function compose(inner, d, licensed) {
    var tail = "";
    if (licensed && d.banner) tail += bannerHtml(d);
    if (licensed && d.disclaimer) tail += disclaimerHtml(d);
    if (!licensed) tail += badgeHtml();
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-family:' + SANS + ';">' +
      '<tr><td style="padding:0;">' + inner + tail + '</td></tr></table>';
  }

  /* ============================================================
     TEMPLATE 1 — Aurora (FREE) · minimal left accent bar
     ============================================================ */
  function renderAurora(d, a) {
    var name = esc(d.name) || "Your Name";
    var meta = "";
    if (d.role) meta += '<span style="color:' + a + ';">' + esc(d.role) + '</span>';
    if (d.company) meta += (meta ? '<span style="color:' + RULE + ';">&nbsp;&middot;&nbsp;</span>' : "") + '<span style="color:' + MUTED + ';">' + esc(d.company) + '</span>';

    var photo = "";
    if (d.headshot) {
      photo = '<td style="padding-right:14px;vertical-align:middle;">' + image(d.headshot, 56, 56, d.name || "Profile photo", 6) + '</td>';
    }

    var contacts = inlineContacts(d);
    var socials = socialsHtml(d, a);

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' + photo +
      '<td style="width:4px;background:' + a + ';font-size:0;line-height:0;">&nbsp;</td>' +
      '<td style="padding-left:14px;vertical-align:top;">' +
        '<div style="font-family:' + SANS + ';font-size:16px;line-height:22px;font-weight:bold;color:' + INK + ';">' + name + '</div>' +
        (meta ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:18px;padding-top:2px;">' + meta + '</div>' : "") +
        (contacts ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:19px;color:' + MUTED + ';padding-top:8px;">' + contacts + '</div>' : "") +
        (socials ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:18px;padding-top:8px;">' + socials + '</div>' : "") +
      '</td></tr></table>';
  }

  /* ============================================================
     TEMPLATE 2 — Slate (FREE) · horizontal rule style
     ============================================================ */
  function renderSlate(d, a) {
    var name = esc(d.name) || "Your Name";
    var roleCompany = [];
    if (d.role) roleCompany.push(esc(d.role));
    if (d.company) roleCompany.push(esc(d.company));
    var contacts = inlineContacts(d);
    var socials = socialsHtml(d, a);

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:420px;max-width:420px;"><tr><td style="border-top:1px solid ' + RULE + ';padding-top:10px;">' +
      '<div style="font-family:' + SANS + ';font-size:14px;line-height:20px;color:' + INK + ';">' +
        '<span style="font-weight:bold;">' + name + '</span>' +
        (roleCompany.length ? '<span style="color:' + FAINT + ';"> &nbsp;&mdash;&nbsp; </span><span style="color:' + MUTED + ';">' + roleCompany.join(", ") + '</span>' : "") +
      '</div>' +
      (contacts ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:19px;color:' + MUTED + ';padding-top:5px;">' + contacts + '</div>' : "") +
      (socials ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:18px;padding-top:6px;">' + socials + '</div>' : "") +
      '</td></tr></table>';
  }

  /* ============================================================
     TEMPLATE 3 — Meridian (PRO) · top accent band + logo right
     ============================================================ */
  function renderMeridian(d, a) {
    var name = esc(d.name) || "Your Name";
    var contacts = stackedContacts(d);
    var socials = socialsHtml(d, a);
    var logo = d.logo
      ? '<td style="padding-left:20px;vertical-align:top;">' + image(d.logo, 110, 40, d.company || "Company logo", 0) + '</td>'
      : "";

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:440px;max-width:440px;"><tr>' +
      '<td style="border-top:4px solid ' + a + ';padding-top:12px;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
          '<td style="vertical-align:top;">' +
            '<div style="font-family:' + SANS + ';font-size:17px;line-height:23px;font-weight:bold;color:' + INK + ';">' + name + '</div>' +
            (d.role ? '<div style="font-family:' + SANS + ';font-size:10px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:' + a + ';padding-top:3px;">' + esc(d.role) + (d.company ? ' &nbsp;/&nbsp; ' + esc(d.company) : "") + '</div>' : (d.company ? '<div style="font-family:' + SANS + ';font-size:10px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:' + a + ';padding-top:3px;">' + esc(d.company) + '</div>' : "")) +
            (contacts ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:19px;color:' + MUTED + ';padding-top:9px;">' + contacts + '</div>' : "") +
            (d.address ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:17px;color:' + FAINT + ';padding-top:4px;">' + esc(d.address) + '</div>' : "") +
            (socials ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:18px;padding-top:9px;">' + socials + '</div>' : "") +
          '</td>' + logo +
        '</tr></table>' +
      '</td></tr></table>';
  }

  /* ============================================================
     TEMPLATE 4 — Duet (PRO) · two-column with photo
     Falls back to a colored initials block when no headshot URL
     is given, so it always looks finished.
     ============================================================ */
  function renderDuet(d, a) {
    var name = esc(d.name) || "Your Name";
    var meta = [];
    if (d.role) meta.push(esc(d.role));
    if (d.company) meta.push(esc(d.company));
    var contacts = inlineContacts(d);
    var socials = socialsHtml(d, a);

    var left;
    if (d.headshot) {
      left = image(d.headshot, 68, 68, d.name || "Profile photo", 8);
    } else {
      left = '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
        '<td style="width:68px;height:68px;background:' + a + ';border-radius:8px;text-align:center;vertical-align:middle;font-family:' + SANS + ';font-size:24px;font-weight:bold;line-height:68px;color:#FFFFFF;">' + initialsOf(d.name) + '</td>' +
        '</tr></table>';
    }

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td style="vertical-align:top;">' + left + '</td>' +
      '<td style="width:18px;font-size:0;line-height:0;">&nbsp;</td>' +
      '<td style="width:1px;background:' + RULE + ';font-size:0;line-height:0;">&nbsp;</td>' +
      '<td style="width:18px;font-size:0;line-height:0;">&nbsp;</td>' +
      '<td style="vertical-align:middle;">' +
        '<div style="font-family:' + SANS + ';font-size:15px;line-height:21px;font-weight:bold;color:' + INK + ';">' + name + '</div>' +
        (meta.length ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:18px;color:' + a + ';padding-top:2px;">' + meta.join('<span style="color:' + RULE + ';">&nbsp;&middot;&nbsp;</span>') + '</div>' : "") +
        (contacts ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:19px;color:' + MUTED + ';padding-top:7px;">' + contacts + '</div>' : "") +
        (d.address ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:17px;color:' + FAINT + ';padding-top:4px;">' + esc(d.address) + '</div>' : "") +
        (socials ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:18px;padding-top:7px;">' + socials + '</div>' : "") +
      '</td></tr></table>';
  }

  /* ============================================================
     TEMPLATE 5 — Summit (PRO) · stacked, centered
     ============================================================ */
  function renderSummit(d, a) {
    var name = esc(d.name) || "Your Name";
    var contacts = stackedContacts(d);
    var socials = socialsHtml(d, a);

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="width:340px;max-width:340px;"><tr><td align="center" style="text-align:center;">' +
      (d.logo ? '<div style="padding-bottom:10px;">' + image(d.logo, 120, 44, d.company || "Company logo", 0) + '</div>' : "") +
      '<div style="font-family:' + SANS + ';font-size:18px;line-height:24px;font-weight:bold;color:' + INK + ';">' + name + '</div>' +
      (d.role ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:17px;letter-spacing:1.5px;text-transform:uppercase;color:' + a + ';padding-top:4px;">' + esc(d.role) + '</div>' : "") +
      (d.company ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:18px;color:' + MUTED + ';padding-top:2px;">' + esc(d.company) + '</div>' : "") +
      '<div style="padding-top:10px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:32px;height:2px;background:' + a + ';font-size:0;line-height:0;">&nbsp;</td></tr></table></div>' +
      (contacts ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:20px;color:' + MUTED + ';padding-top:9px;">' + contacts + '</div>' : "") +
      (d.address ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:17px;color:' + FAINT + ';padding-top:4px;">' + esc(d.address) + '</div>' : "") +
      (socials ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:18px;padding-top:9px;">' + socials + '</div>' : "") +
      '</td></tr></table>';
  }

  /* ============================================================
     TEMPLATE 6 — Emblem (PRO) · initials badge
     ============================================================ */
  function renderEmblem(d, a) {
    var name = esc(d.name) || "Your Name";
    var meta = [];
    if (d.role) meta.push(esc(d.role));
    if (d.company) meta.push(esc(d.company));
    var contacts = inlineContacts(d);
    var socials = socialsHtml(d, a);

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td style="padding-right:14px;vertical-align:top;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
          '<td style="width:44px;height:44px;background:' + a + ';border-radius:22px;text-align:center;vertical-align:middle;font-family:' + SANS + ';font-size:16px;font-weight:bold;line-height:44px;color:#FFFFFF;">' + initialsOf(d.name) + '</td>' +
        '</tr></table>' +
      '</td>' +
      '<td style="vertical-align:top;">' +
        '<div style="font-family:' + SANS + ';font-size:15px;line-height:21px;font-weight:bold;color:' + INK + ';">' + name + '</div>' +
        (meta.length ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:18px;color:' + MUTED + ';">' + meta.join('<span style="color:' + RULE + ';">&nbsp;&middot;&nbsp;</span>') + '</div>' : "") +
        (contacts ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:19px;color:' + MUTED + ';padding-top:6px;">' + contacts + '</div>' : "") +
        (d.address ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:17px;color:' + FAINT + ';padding-top:4px;">' + esc(d.address) + '</div>' : "") +
        (socials ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:18px;padding-top:6px;">' + socials + '</div>' : "") +
      '</td></tr></table>';
  }

  /* ============================================================
     TEMPLATE 7 — Mono (PRO) · compact, monospace
     ============================================================ */
  function renderMono(d, a) {
    var name = esc(d.name) || "Your Name";
    var items = contactItems(d);
    var links = [];
    for (var i = 0; i < items.length; i++) {
      links.push('<a href="' + esc(items[i].href) + '" style="color:' + MUTED + ';text-decoration:none;">' + esc(items[i].text) + '</a>');
    }
    var socials = socialsHtml(d, a);

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:420px;max-width:420px;"><tr><td style="border-left:2px solid ' + INK + ';padding-left:12px;">' +
      '<div style="font-family:' + MONO + ';font-size:12px;line-height:18px;font-weight:bold;color:' + INK + ';">' + name + '</div>' +
      ((d.role || d.company) ? '<div style="font-family:' + MONO + ';font-size:11px;line-height:17px;color:' + MUTED + ';">' + esc(d.role || "") + (d.role && d.company ? ' / ' : "") + esc(d.company || "") + '</div>' : "") +
      (links.length ? '<div style="font-family:' + MONO + ';font-size:11px;line-height:17px;color:' + MUTED + ';padding-top:4px;">' + links.join('<span style="color:' + RULE + ';"> | </span>') + '</div>' : "") +
      (d.address ? '<div style="font-family:' + MONO + ';font-size:10px;line-height:16px;color:' + FAINT + ';">' + esc(d.address) + '</div>' : "") +
      (socials ? '<div style="font-family:' + MONO + ';font-size:10px;line-height:16px;padding-top:4px;">' + socials + '</div>' : "") +
      '</td></tr></table>';
  }

  /* ============================================================
     TEMPLATE 8 — Pinnacle (PRO) · bold header
     ============================================================ */
  function renderPinnacle(d, a) {
    var name = esc(d.name) || "Your Name";
    var contacts = inlineContacts(d);
    var socials = socialsHtml(d, a);
    var logo = d.logo
      ? '<td style="padding-left:24px;vertical-align:top;text-align:right;">' + image(d.logo, 110, 40, d.company || "Company logo", 0) + '</td>'
      : "";

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:460px;max-width:460px;"><tr>' +
      '<td style="vertical-align:top;">' +
        '<div style="font-family:' + SANS + ';font-size:21px;line-height:27px;font-weight:bold;color:' + INK + ';border-bottom:3px solid ' + a + ';display:inline-block;padding-bottom:4px;">' + name + '</div>' +
        '<div style="font-family:' + SANS + ';font-size:10px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:' + MUTED + ';padding-top:7px;">' +
          esc(d.role || "") + (d.role && d.company ? ' &nbsp;&bull;&nbsp; ' : "") + '<span style="color:' + a + ';">' + esc(d.company || "") + '</span>' +
        '</div>' +
        (contacts ? '<div style="font-family:' + SANS + ';font-size:12px;line-height:19px;color:' + MUTED + ';padding-top:10px;">' + contacts + '</div>' : "") +
        (d.address ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:17px;color:' + FAINT + ';padding-top:4px;">' + esc(d.address) + '</div>' : "") +
        (socials ? '<div style="font-family:' + SANS + ';font-size:11px;line-height:18px;padding-top:9px;">' + socials + '</div>' : "") +
      '</td>' + logo +
      '</tr></table>';
  }

  /* ---------------- registry ---------------- */

  window.SF_TEMPLATES = [
    { id: "aurora",    name: "Aurora",    tagline: "Minimal left accent bar",        pro: false, render: renderAurora },
    { id: "slate",     name: "Slate",     tagline: "Clean horizontal rule",          pro: false, render: renderSlate },
    { id: "meridian",  name: "Meridian",  tagline: "Top band with logo",             pro: true,  render: renderMeridian },
    { id: "duet",      name: "Duet",      tagline: "Two-column with photo",          pro: true,  render: renderDuet },
    { id: "summit",    name: "Summit",    tagline: "Stacked and centered",           pro: true,  render: renderSummit },
    { id: "emblem",    name: "Emblem",    tagline: "Initials badge style",           pro: true,  render: renderEmblem },
    { id: "mono",      name: "Mono",      tagline: "Compact monospace",              pro: true,  render: renderMono },
    { id: "pinnacle",  name: "Pinnacle",  tagline: "Bold header statement",          pro: true,  render: renderPinnacle }
  ];

  window.SF_TEMPLATE_MAP = {};
  for (var t = 0; t < window.SF_TEMPLATES.length; t++) {
    window.SF_TEMPLATE_MAP[window.SF_TEMPLATES[t].id] = window.SF_TEMPLATES[t];
  }

  /* Main entry point: renders a complete, copy-ready signature. */
  window.SF_renderSignature = function (templateId, data, licensed) {
    var tpl = window.SF_TEMPLATE_MAP[templateId] || window.SF_TEMPLATES[0];
    var d = data || {};
    var accent = /^#[0-9A-Fa-f]{6}$/.test(String(d.accent || "")) ? d.accent : "#7C3AED";
    var inner = tpl.render(d, accent);
    return compose(inner, d, !!licensed);
  };
})();
