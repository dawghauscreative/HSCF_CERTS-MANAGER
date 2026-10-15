/*! HydroScience COA Badge v1.1
 *  Embeddable "3rd-Party Lab Tested" badge that opens the brand's Certificate of Analysis.
 *  Drop-in: works in WordPress/Divi, GoHighLevel, Shopify, Wix, Squarespace, plain HTML.
 *  Styles live in Shadow DOM so the host site's theme can't break the badge (and vice versa).
 *
 *  Usage (recommended, v1.1): badge data lives in the HydroScience COA Badges Google Sheet.
 *    <div data-hs-coa="example-daily-foundation"></div>
 *    <script src="https://\u2026/hs-coa-widget.min.js"></script>
 *  The value is the sheet's badge_id. Edit the sheet row and every badge with that ID updates
 *  (Google caches the published sheet for up to 5 minutes). Rows with active = no are hidden.
 *  Display options still go on the embed: data-variant, data-theme, data-position.
 *  data-sheet="<published CSV URL>" points one badge at a different sheet.
 *
 *  Usage (self-contained, v1.0 style): all data in attributes, no sheet.
 *    <div data-hs-coa
 *         data-coa="https://\u2026/coa.pdf"
 *         data-brand="Brand" data-product="Product" data-lot="LOT123"
 *         data-certified="03/01/2026" data-expires="03/01/2028"
 *         data-potency="Vitamin C|500 mg|560 mg; Zinc|15 mg|16.2 mg"
 *         data-variant="seal"></div>
 *    <script src="hs-coa-widget.js"></script>
 *
 *  Optional attributes:
 *    data-variant   seal (default) | pill | float
 *    data-theme     light (default) | dark      \u2014 badge colors only; popup is always light
 *    data-position  left (default) | right      \u2014 float variant only
 *    data-tests     "Purity:Passed, Potency:Passed, \u2026"  (defaults to the six standard screens, all Passed)
 *    data-pages     comma-separated image URLs of the COA pages (best mobile experience)
 *    data-verifier  name shown as the verifying party (default HydroScience Custom Formulations)
 *    data-verifier-url  link on that name (default https://hydroscience.health/certifications/)
 *
 *  JS API: HSCOA.mount(element, config) \u00b7 HSCOA.open(config) \u00b7 HSCOA.scan()
 */
(function () {
  "use strict";
  if (window.HSCOA && window.HSCOA.version) { window.HSCOA.scan(); return; }

  var SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-QIcE9L1UbD7rp9zUscn5neva4zCCKZ02aHEj-kZBBPX0fcIsOJdN5YK-bT0w2rbAJHN36jL4K9yF/pub?output=csv";
  var DEFAULT_TESTS = ["Purity", "Potency", "Microbial Safety", "Heavy Metals", "Pesticide Residues", "Residual Solvents"];
  var FONT_BODY = "Calibri, Carlito, 'Segoe UI', system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif";
  var FONT_HEAD = "Georgia, 'Times New Roman', Times, serif";
  var uid = 0;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    return /^(https?:|data:image\/|\/|\.\/)/i.test(u) ? u : "";
  }
  function list(v) {
    if (Array.isArray(v)) return v;
    return v ? String(v).split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
  }
  function parseTests(v) {
    if (Array.isArray(v)) return v;
    if (!v) return DEFAULT_TESTS.map(function (n) { return { name: n, status: "Passed" }; });
    return String(v).split(",").map(function (t) {
      var p = t.split(":");
      return { name: p[0].trim(), status: (p[1] || "Passed").trim() };
    }).filter(function (t) { return t.name; });
  }
  function parsePotency(v) {
    var rows = Array.isArray(v) ? v : (v ? String(v).split(";").map(function (r) {
      var p = r.split("|").map(function (x) { return x.trim(); });
      return p.length >= 3 ? { name: p[0], claim: p[1], actual: p[2] } : null;
    }) : []);
    return rows.filter(Boolean).map(function (r) {
      var c = parseFloat(r.claim), a = parseFloat(r.actual);
      return c > 0 && !isNaN(a) ? { name: r.name, claim: r.claim, actual: r.actual, pct: Math.round(a / c * 100) } : null;
    }).filter(Boolean);
  }
  function normalize(c) {
    c = c || {};
    return {
      __n: true,
      coa: safeUrl(c.coa),
      brand: c.brand || "", product: c.product || "", lot: c.lot || "",
      certified: c.certified || "", expires: c.expires || "",
      tests: parseTests(c.tests),
      potency: parsePotency(c.potency),
      pages: list(c.pages).map(safeUrl).filter(Boolean),
      variant: String(c.variant || "seal").toLowerCase(),
      theme: String(c.theme || "light").toLowerCase(),
      position: String(c.position || "left").toLowerCase(),
      verifier: c.verifier || "HydroScience Custom Formulations",
      verifierUrl: c.verifierUrl === "" ? "" : safeUrl(c.verifierUrl || "https://hydroscience.health/certifications/")
    };
  }
  function readConfig(el) { var d = el.dataset; return normalize({
    coa: d.coa, brand: d.brand, product: d.product, lot: d.lot, certified: d.certified, expires: d.expires,
    tests: d.tests, potency: d.potency, pages: d.pages, variant: d.variant, theme: d.theme,
    position: d.position, verifier: d.verifier, verifierUrl: d.verifierUrl
  }); }
  function passedCount(cfg) { return cfg.tests.filter(function (t) { return /pass/i.test(t.status); }).length; }

  /* ---------- Seal artwork ---------- */
  function seal(px, ring) {
    var id = "hsc" + (++uid);
    return '<svg class="seal" width="' + px + '" height="' + px + '" viewBox="0 0 100 100" aria-hidden="true">' +
      '<defs><path id="' + id + '" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0"/></defs>' +
      '<circle cx="50" cy="50" r="49" fill="#085041"/>' +
      '<circle cx="50" cy="50" r="45.5" fill="none" stroke="#1D9E75" stroke-width="1.2"/>' +
      (ring === false ? "" :
        '<text font-family="Arial, Helvetica, sans-serif" font-size="8.6" font-weight="700" fill="#E1F5EE">' +
        '<textPath href="#' + id + '" textLength="228" lengthAdjust="spacing">3RD-PARTY TESTED \u2022 LAB VERIFIED \u2022</textPath></text>') +
      '<circle cx="50" cy="50" r="' + (ring === false ? 34 : 25) + '" fill="#1D9E75"/>' +
      '<path d="' + (ring === false ? "M33 51 l11 11 l23 -25" : "M38.5 50.5 l8 8 l16 -17.5") + '" fill="none" stroke="#fff" stroke-width="' + (ring === false ? 8 : 6) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>";
  }

  /* ---------- Badge ---------- */
  var BADGE_CSS =
    ":host{all:initial;display:inline-block;vertical-align:middle;max-width:100%}" +
    ":host([hidden]){display:none}" +
    "*{box-sizing:border-box}" +
    ".b{--bg:#fff;--ink:#0B2B24;--muted:#4A6A62;--g:#1D9E75;--line:#CFE8DF;--tint:#E1F5EE;" +
    "all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:14px;max-width:100%;cursor:pointer;" +
    "font-family:" + FONT_BODY + ";color:var(--ink);background:var(--bg);border:1px solid var(--line);text-align:left;" +
    "-webkit-tap-highlight-color:transparent;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}" +
    ".b.dark{--bg:#0B2E26;--ink:#F2FBF7;--muted:#A9CFC3;--g:#5FD3A9;--line:#1E5546;--tint:#103A30}" +
    ".b:focus-visible{outline:3px solid var(--g);outline-offset:3px}" +
    ".seal{flex:none;display:block}" +
    ".tx{display:flex;flex-direction:column;gap:3px;min-width:0}" +
    ".eb{font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--g);line-height:1.2}" +
    ".ti{font-family:" + FONT_HEAD + ";font-size:19px;line-height:1.15;color:var(--ink);display:flex;align-items:center;gap:8px}" +
    ".ti .ar{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--tint);color:var(--g);font-family:" + FONT_BODY + ";font-size:13px;transition:transform .18s ease}" +
    ".mt{font-size:13px;color:var(--muted);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".mt b{color:var(--ink);font-weight:600}" +
    /* seal */
    ".b.seal-v{padding:11px 20px 11px 11px;border-radius:16px;box-shadow:0 1px 2px rgba(8,80,65,.06),0 10px 24px -14px rgba(8,80,65,.45)}" +
    ".b.seal-v:hover{transform:translateY(-2px);border-color:var(--g);box-shadow:0 2px 4px rgba(8,80,65,.08),0 16px 32px -16px rgba(8,80,65,.55)}" +
    ".b:hover .ar{transform:translateX(2px)}" +
    /* pill */
    ".b.pill-v{gap:9px;padding:5px 14px 5px 5px;border-radius:999px;font-size:14px}" +
    ".b.pill-v:hover{border-color:var(--g)}" +
    ".pl{font-weight:700;letter-spacing:.01em}" +
    ".pv{color:var(--g);font-weight:600;display:inline-flex;align-items:center;gap:4px}" +
    ".pd{width:1px;height:16px;background:var(--line)}" +
    /* float */
    ".fl{position:fixed;z-index:2147482000;bottom:calc(18px + env(safe-area-inset-bottom,0px))}" +
    ".fl.left{left:calc(18px + env(safe-area-inset-left,0px))}.fl.right{right:calc(18px + env(safe-area-inset-right,0px))}" +
    ".fl .b{box-shadow:0 12px 30px -10px rgba(4,40,32,.45)}" +
    "@media (prefers-reduced-motion:reduce){.b,.ar{transition:none}.b:hover{transform:none}}";

  function badgeHTML(cfg) {
    var n = cfg.tests.length, ok = passedCount(cfg);
    var dark = cfg.theme === "dark" ? " dark" : "";
    var label = "View the third-party Certificate of Analysis" + (cfg.product ? " for " + cfg.product : "");
    if (cfg.variant === "pill" || cfg.variant === "float") {
      var pill = '<button class="b pill-v' + dark + '" type="button" aria-haspopup="dialog" aria-label="' + esc(label) + '">' +
        seal(30, false) + '<span class="pl">Lab Tested</span><span class="pd"></span><span class="pv">View COA <span aria-hidden="true">\u2192</span></span></button>';
      return cfg.variant === "float" ? '<div class="fl ' + (cfg.position === "right" ? "right" : "left") + '">' + pill + "</div>" : pill;
    }
    var meta = (cfg.lot ? "Lot <b>" + esc(cfg.lot) + "</b> \u00b7 " : "") + ok + " of " + n + " screens passed";
    return '<button class="b seal-v' + dark + '" type="button" aria-haspopup="dialog" aria-label="' + esc(label) + '">' +
      seal(62) +
      '<span class="tx"><span class="eb">3rd-Party Lab Tested</span>' +
      '<span class="ti">Certificate of Analysis <span class="ar" aria-hidden="true">\u2192</span></span>' +
      '<span class="mt">' + meta + "</span></span></button>";
  }

  function mount(el, config) {
    if (!el || el.__hscoa) return;
    var cfg = config ? normalize(config) : readConfig(el);
    if (!cfg.coa && !cfg.pages.length) { console.warn("[HSCOA] Missing data-coa URL on", el); return; }
    el.__hscoa = cfg;
    var root = el.shadowRoot || (el.attachShadow ? el.attachShadow({ mode: "open" }) : el);
    root.innerHTML = "<style>" + BADGE_CSS + "</style>" + badgeHTML(cfg);
    var btn = root.querySelector("button");
    btn.addEventListener("click", function () { open(cfg, btn); });
  }

  /* ---------- Popup ---------- */
  var MODAL_CSS =
    ":host{all:initial}*{box-sizing:border-box}" +
    ".ov{--g:#1D9E75;--deep:#085041;--tint:#E1F5EE;--ink:#0B2B24;--muted:#53716A;--line:#D9EAE3;--paper:#fff;--wash:#F3F8F6;--warn:#B4561F;" +
    "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;" +
    "padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));" +
    "background:rgba(3,28,22,.62);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);" +
    "font-family:" + FONT_BODY + ";color:var(--ink);font-size:15px;line-height:1.45;animation:fd .22s ease both}" +
    ".pn{position:relative;width:min(1080px,100%);height:min(860px,100%);display:grid;grid-template-columns:minmax(300px,380px) 1fr;" +
    "background:var(--paper);border-radius:20px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(0,0,0,.5);animation:up .28s cubic-bezier(.2,.8,.2,1) backwards}" +
    ".x{all:unset;position:absolute;top:12px;right:12px;z-index:3;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;cursor:pointer;" +
    "background:rgba(255,255,255,.92);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.18)}" +
    ".x:hover{background:#fff}.x:focus-visible,a:focus-visible,.cta:focus-visible{outline:3px solid var(--g);outline-offset:2px}" +
    /* summary column */
    ".sum{overflow-y:auto;overscroll-behavior:contain;background:var(--wash);border-right:1px solid var(--line);display:flex;flex-direction:column}" +
    ".hd{display:flex;gap:14px;align-items:center;padding:26px 26px 22px;background:var(--deep);color:#fff;position:relative}" +
    ".hd:after{content:'';position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,var(--g),#7FD9B6)}" +
    ".hd .seal{flex:none}" +
    ".eb{margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9BE3C7}" +
    "h2{margin:0;font-family:" + FONT_HEAD + ";font-weight:400;font-size:25px;line-height:1.1;text-wrap:balance}" +
    ".bd{padding:22px 26px 26px;display:flex;flex-direction:column;gap:24px}" +
    ".facts{margin:0;display:grid;grid-template-columns:auto 1fr;gap:7px 16px;font-size:14px}" +
    ".facts dt{color:var(--muted)}.facts dd{margin:0;font-weight:600;overflow-wrap:anywhere}" +
    ".sh{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 0 10px}" +
    "h3{margin:0;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--deep)}" +
    ".tally{font-size:13px;font-weight:700;color:var(--g);font-variant-numeric:tabular-nums}" +
    ".tests{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
    ".tests li{display:flex;align-items:center;gap:9px;padding:9px 10px;background:var(--paper);border:1px solid var(--line);border-radius:10px;min-width:0}" +
    ".ck{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--g);color:#fff}" +
    ".tests li.no .ck{background:var(--warn)}" +
    ".tn{display:flex;flex-direction:column;min-width:0;line-height:1.2}" +
    ".tn b{font-size:13.5px;font-weight:600}.tn span{font-size:12px;color:var(--g);font-weight:600}.tests li.no .tn span{color:var(--warn)}" +
    ".note{margin:-4px 0 12px;font-size:13.5px;color:var(--muted)}" +
    ".bars{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:11px}" +
    ".bars li{display:grid;grid-template-columns:1fr auto;gap:4px 10px;font-size:13px}" +
    ".bn{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".bp{font-weight:700;color:var(--deep);font-variant-numeric:tabular-nums}" +
    ".tr{grid-column:1/-1;position:relative;height:8px;border-radius:99px;background:#E3EEEA}" +
    ".fi{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,#6ACDA8,var(--g));transform-origin:left;animation:gr .7s .15s cubic-bezier(.2,.8,.2,1) both}" +
    ".fi.lo{background:var(--warn)}" +
    ".mk{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--deep);border-radius:1px}" +
    ".bc{grid-column:1/-1;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}" +
    ".lg{margin:10px 0 0;font-size:11.5px;color:var(--muted);display:flex;align-items:center;gap:6px}" +
    ".lg i{display:inline-block;width:2px;height:11px;background:var(--deep)}" +
    ".vf{margin-top:auto;padding:16px 26px 22px;border-top:1px solid var(--line);font-size:12.5px;color:var(--muted);display:flex;gap:10px;align-items:flex-start}" +
    ".vf b{color:var(--ink);font-weight:600}" +
    ".vf a{color:var(--deep);font-weight:700;text-decoration:underline;text-decoration-color:var(--g);text-underline-offset:2px}" +
    ".vf a:hover{color:var(--g)}" +
    /* viewer column */
    ".vw{display:flex;flex-direction:column;min-width:0;min-height:0;background:#E7ECEA}" +
    ".tb{display:flex;align-items:center;gap:12px;padding:14px 64px 14px 20px;background:var(--paper);border-bottom:1px solid var(--line)}" +
    ".tb .lb{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-right:auto}" +
    ".tb a{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:var(--tint);color:var(--deep);font-weight:700;font-size:13.5px;text-decoration:none}" +
    ".tb a:hover{background:#CDEEDF}" +
    ".doc{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain}" +
    ".doc iframe{display:block;width:100%;height:100%;border:0;background:#fff}" +
    ".pgs{display:flex;flex-direction:column;align-items:center;gap:18px;padding:22px}" +
    ".pgs img{display:block;width:100%;max-width:760px;height:auto;background:#fff;border-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,.14)}" +
    ".fb{height:100%;min-height:240px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:28px;text-align:center;color:var(--muted)}" +
    ".fb svg{color:var(--g)}" +
    ".cta{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:999px;background:var(--g);color:#fff;font-weight:700;font-size:15px;text-decoration:none}" +
    ".cta:hover{background:#178a66}" +
    /* mobile: full-height sheet, one scrolling column */
    "@media (max-width:760px){" +
    ".ov{padding:0;align-items:flex-end}" +
    ".pn{grid-template-columns:1fr;height:auto;max-height:100%;border-radius:20px 20px 0 0;overflow-y:auto;overscroll-behavior:contain;display:block}" +
    ".sum{overflow:visible;border-right:0}" +
    ".hd{padding:max(22px,env(safe-area-inset-top,0px)) 20px 20px;padding-right:64px}" +
    ".bd{padding:20px}.vf{padding:14px 20px 18px}" +
    ".x{position:fixed;top:max(12px,env(safe-area-inset-top,0px))}" +
    ".vw{min-height:0}.doc{overflow:visible}.tb{padding:12px 20px}" +
    ".pgs{padding:14px 12px calc(20px + env(safe-area-inset-bottom,0px))}" +
    ".fb{padding-bottom:calc(32px + env(safe-area-inset-bottom,0px))}}" +
    "@media (max-width:360px){.tests{grid-template-columns:1fr}}" +
    "@keyframes fd{from{opacity:0}}@keyframes up{from{opacity:0;transform:translateY(18px) scale(.985)}}@keyframes gr{from{transform:scaleX(0)}}" +
    "@media (prefers-reduced-motion:reduce){.ov,.pn,.fi{animation:none}}";

  var CHECK = '<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.4l3 3 6-6.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CROSS = '<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var CLOSE = '<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var DOC = '<svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true"><path d="M12 5h17l9 9v29H12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M29 5v9h9M18 25h12M18 31h12M18 37h7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

  function smallScreen() {
    return window.matchMedia && window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  }

  function modalHTML(cfg) {
    var facts = [["Brand", cfg.brand], ["Product", cfg.product], ["Lot", cfg.lot], ["Certified", cfg.certified], ["Expires", cfg.expires]]
      .filter(function (f) { return f[1]; })
      .map(function (f) { return "<dt>" + f[0] + "</dt><dd>" + esc(f[1]) + "</dd>"; }).join("");

    var ok = passedCount(cfg);
    var tests = cfg.tests.map(function (t) {
      var pass = /pass/i.test(t.status);
      return '<li class="' + (pass ? "" : "no") + '"><span class="ck">' + (pass ? CHECK : CROSS) + '</span><span class="tn"><b>' +
        esc(t.name) + "</b><span>" + esc(t.status) + "</span></span></li>";
    }).join("");

    var potency = "";
    if (cfg.potency.length) {
      var max = Math.max(150, Math.ceil((Math.max.apply(null, cfg.potency.map(function (p) { return p.pct; })) + 10) / 10) * 10);
      var allMeet = cfg.potency.every(function (p) { return p.pct >= 100; });
      var marker = (100 / max * 100).toFixed(2);
      potency = '<section><div class="sh"><h3>Potency vs. label claim</h3><span class="tally">' +
        cfg.potency.filter(function (p) { return p.pct >= 100; }).length + "/" + cfg.potency.length + " meet claim</span></div>" +
        (allMeet ? '<p class="note">Every active ingredient tested at or above the amount on the label.</p>' : "") +
        '<ul class="bars">' + cfg.potency.map(function (p) {
          return "<li><span class=\"bn\">" + esc(p.name) + '</span><span class="bp">' + p.pct + "%</span>" +
            '<span class="tr"><span class="fi' + (p.pct < 100 ? " lo" : "") + '" style="width:' + Math.min(100, p.pct / max * 100).toFixed(2) + '%"></span>' +
            '<span class="mk" style="left:calc(' + marker + '% - 1px)"></span></span>' +
            '<span class="bc">Label ' + esc(p.claim) + " \u2192 tested " + esc(p.actual) + "</span></li>";
        }).join("") + '</ul><p class="lg"><i></i>Marker = 100% of label claim</p></section>';
    }

    var viewer;
    if (cfg.pages.length) {
      viewer = '<div class="pgs">' + cfg.pages.map(function (src, i) {
        return '<img src="' + esc(src) + '" alt="Certificate of Analysis, page ' + (i + 1) + " of " + cfg.pages.length + '" loading="lazy">';
      }).join("") + "</div>";
    } else if (!smallScreen()) {
      viewer = '<iframe src="' + esc(cfg.coa) + '#view=FitH" title="Certificate of Analysis PDF"></iframe>';
    } else {
      viewer = '<div class="fb">' + DOC + "<div>The full lab report opens as a PDF.</div>" +
        '<a class="cta" href="' + esc(cfg.coa) + '" target="_blank" rel="noopener">View full certificate <span aria-hidden="true">\u2197</span></a></div>';
    }

    return '<div class="ov" data-ov>' +
      '<div class="pn" role="dialog" aria-modal="true" aria-labelledby="hs-t">' +
      '<button class="x" type="button" aria-label="Close certificate" data-x>' + CLOSE + "</button>" +
      '<aside class="sum">' +
      '<header class="hd">' + seal(58) + '<div><p class="eb">3rd Party Guaranteed</p><h2 id="hs-t">Certificate of Analysis</h2></div></header>' +
      '<div class="bd">' +
      (facts ? '<dl class="facts">' + facts + "</dl>" : "") +
      '<section><div class="sh"><h3>Quality screens</h3><span class="tally">' + ok + "/" + cfg.tests.length + ' passed</span></div><ul class="tests">' + tests + "</ul></section>" +
      potency +
      "</div>" +
      '<footer class="vf">' + seal(28, false) + "<span>Independently tested and verified by " + (cfg.verifierUrl ? '<a href="' + esc(cfg.verifierUrl) + '" target="_blank" rel="noopener">' + esc(cfg.verifier) + "</a>" : "<b>" + esc(cfg.verifier) + "</b>") + "." +
      (cfg.certified ? " Certified " + esc(cfg.certified) + "." : "") + "</span></footer>" +
      "</aside>" +
      '<section class="vw" aria-label="Full certificate">' +
      '<div class="tb"><span class="lb">Full lab report</span>' +
      (cfg.coa ? '<a href="' + esc(cfg.coa) + '" target="_blank" rel="noopener">Open PDF <span aria-hidden="true">\u2197</span></a>' : "") +
      "</div>" +
      '<div class="doc">' + viewer + "</div></section>" +
      "</div></div>";
  }

  var host, shadow, lastFocus, prevOverflow;
  function onKey(e) {
    if (!shadow) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Tab") {
      var f = Array.prototype.slice.call(shadow.querySelectorAll("button,a[href],iframe"));
      if (!f.length) return;
      var a = shadow.activeElement, first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (a === first || !a)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !a)) { e.preventDefault(); first.focus(); }
    }
  }
  function open(config, returnTo) {
    var cfg = config && config.__n ? config : normalize(config);
    close(true);
    lastFocus = returnTo || document.activeElement;
    host = document.createElement("div");
    host.setAttribute("data-hs-coa-modal", "");
    document.body.appendChild(host);
    shadow = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    shadow.innerHTML = "<style>" + MODAL_CSS + "</style>" + modalHTML(cfg);
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    shadow.querySelector("[data-x]").addEventListener("click", function () { close(); });
    shadow.querySelector("[data-ov]").addEventListener("click", function (e) { if (e.target === e.currentTarget) close(); });
    document.addEventListener("keydown", onKey, true);
    shadow.querySelector("[data-x]").focus();
  }
  function close(silent) {
    if (!host) return;
    document.removeEventListener("keydown", onKey, true);
    host.remove(); host = shadow = null;
    document.documentElement.style.overflow = prevOverflow || "";
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Google Sheet data source ---------- */
  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    return rows.slice(1).map(function (r) {
      var o = {};
      head.forEach(function (h, j) { o[h] = (r[j] || "").trim(); });
      return o;
    });
  }
  var sheetCache = {};
  function loadSheet(url) {
    if (!sheetCache[url]) {
      sheetCache[url] = fetch(url, { credentials: "omit" })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
        .then(parseCSV)
        .catch(function (e) { delete sheetCache[url]; throw e; });
    }
    return sheetCache[url];
  }
  function mountFromSheet(el, id) {
    if (el.__hscoa || el.__hscoaLoading) return;
    el.__hscoaLoading = true;
    var d = el.dataset, url = d.sheet || SHEET_URL;
    loadSheet(url).then(function (rows) {
      var key = id.toLowerCase();
      var row = rows.filter(function (r) { return (r.badge_id || "").toLowerCase() === key; })[0];
      if (!row) { console.warn("[HSCOA] No row in the badge sheet for badge_id", id); return; }
      if (/^(no|false|0|off|inactive)$/i.test(row.active || "")) return;
      mount(el, {
        coa: row.coa_url, brand: row.brand, product: row.product, lot: row.lot,
        certified: row.certified, expires: row.expires,
        tests: row.tests || undefined, potency: row.potency, pages: row.pages,
        verifier: row.verifier || undefined, verifierUrl: row.verifier_url || undefined,
        variant: d.variant, theme: d.theme, position: d.position
      });
    }).catch(function (e) {
      console.warn("[HSCOA] Could not load the badge sheet:", e && e.message);
    }).then(function () { el.__hscoaLoading = false; });
  }

  function scan(root) {
    (root || document).querySelectorAll("[data-hs-coa]").forEach(function (el) {
      var id = (el.getAttribute("data-hs-coa") || "").trim();
      if (id) mountFromSheet(el, id); else mount(el);
    });
  }

  window.HSCOA = { version: "1.1", mount: mount, open: open, close: close, scan: scan };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { scan(); });
  else scan();
})();
