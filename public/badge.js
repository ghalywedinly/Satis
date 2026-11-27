/*
 * Satis Score badge. Brands paste:
 *   <script src="https://satis-app.com/badge.js" async></script>
 *   <div data-satis-score="your-page" data-style="full"></div>
 * Optional: data-lang="ar|en" (defaults to the page's language).
 * Renders inside a shadow root so the brand's styles can't change it. All text comes
 * translated from the Satis server; this file holds no copy of its own.
 */
(function () {
  var script = document.currentScript;
  var origin = script && script.src ? new URL(script.src).origin : "https://satis-app.com";
  var SEAL =
    "47.5,24.0 46.4,26.0 44.2,27.6 42.8,29.0 43.3,31.0 44.4,33.5 44.4,35.8 42.4,36.9 39.7,37.2 37.8,37.8 37.2,39.7 36.9,42.4 35.8,44.4 33.5,44.4 31.0,43.3 29.0,42.8 27.6,44.2 26.0,46.4 24.0,47.5 22.0,46.4 20.4,44.2 19.0,42.8 17.0,43.3 14.5,44.4 12.3,44.4 11.1,42.4 10.8,39.7 10.2,37.8 8.3,37.2 5.6,36.9 3.6,35.8 3.6,33.5 4.7,31.0 5.2,29.0 3.8,27.6 1.6,26.0 0.5,24.0 1.6,22.0 3.8,20.4 5.2,19.0 4.7,17.0 3.6,14.5 3.6,12.2 5.6,11.1 8.3,10.8 10.2,10.2 10.8,8.3 11.1,5.6 12.2,3.6 14.5,3.6 17.0,4.7 19.0,5.2 20.4,3.8 22.0,1.6 24.0,0.5 26.0,1.6 27.6,3.8 29.0,5.2 31.0,4.7 33.5,3.6 35.7,3.6 36.9,5.6 37.2,8.3 37.8,10.2 39.7,10.8 42.4,11.1 44.4,12.3 44.4,14.5 43.3,17.0 42.8,19.0 44.2,20.4 46.4,22.0";
  var MARK = ["40,4 98,4 68.3,30 10.3,30", "11.1,34 57.1,34 94.9,58 48.9,58", "66,88 8,88 37.7,62 95.7,62"];
  var STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z";
  var NS = "http://www.w3.org/2000/svg";

  function svg(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function seal(size) {
    var s = svg("svg", { viewBox: "0 0 48 48", width: size, height: size, "aria-hidden": "true" });
    s.appendChild(svg("polygon", { points: SEAL, fill: "#FFCF28" }));
    var g = svg("g", { transform: "translate(11.5 13.4) scale(0.23)", fill: "#0B0D12" });
    MARK.forEach(function (p) {
      g.appendChild(svg("polygon", { points: p }));
    });
    s.appendChild(g);
    return s;
  }

  function stars(value, size) {
    var wrap = document.createElement("span");
    wrap.className = "stars";
    for (var i = 1; i <= 5; i++) {
      var fill = Math.max(0, Math.min(1, value - (i - 1)));
      var id = "s" + Math.random().toString(36).slice(2);
      var s = svg("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true" });
      var defs = svg("defs", {});
      var grad = svg("linearGradient", { id: id });
      grad.appendChild(svg("stop", { offset: fill, "stop-color": "#FFCF28" }));
      grad.appendChild(svg("stop", { offset: fill, "stop-color": "#E5DFD5" }));
      defs.appendChild(grad);
      s.appendChild(defs);
      s.appendChild(svg("path", { d: STAR, fill: "url(#" + id + ")" }));
      wrap.appendChild(s);
    }
    return wrap;
  }

  function text(tag, cls, value) {
    var el = document.createElement(tag);
    el.className = cls;
    el.textContent = value;
    return el;
  }

  var CSS =
    ":host{all:initial;display:inline-block}" +
    "a{display:inline-flex;align-items:center;gap:10px;padding:6px 16px 6px 6px;border-radius:999px;background:#fff;color:#0B0D12;" +
    "text-decoration:none;font-family:system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;box-shadow:0 0 0 1px #ECEEF2;line-height:1.2}" +
    "a[dir=rtl]{padding:6px 6px 6px 16px}" +
    "a:focus-visible{outline:3px solid #B6BEFB;outline-offset:2px}" +
    ".score{font-weight:800;font-size:24px;letter-spacing:-0.02em}" +
    ".small .score{font-size:18px}" +
    ".col{display:flex;flex-direction:column;gap:2px}" +
    ".stars{display:inline-flex;gap:1px}" +
    ".meta{font-size:11px;color:#5B6882;white-space:nowrap}" +
    ".meta b,.sat{font-weight:700;color:#0B0D12}" +
    ".sat{font-size:12px;white-space:nowrap}" +
    ".wait{font-size:13px;font-weight:600}";

  function render(host, data, style) {
    var root = host.shadowRoot || host.attachShadow({ mode: "open" });
    root.textContent = "";
    var css = document.createElement("style");
    css.textContent = CSS;
    root.appendChild(css);
    var a = document.createElement("a");
    a.href = data.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.dir = data.lang === "ar" ? "rtl" : "ltr";
    a.lang = data.lang;
    a.setAttribute("aria-label", data.label);
    if (style === "small") a.className = "small";
    a.appendChild(seal(style === "small" ? 28 : 40));
    if (data.score === null) {
      a.appendChild(text("span", "wait", data.collecting));
    } else if (style === "small") {
      a.appendChild(text("span", "score", data.score));
      a.appendChild(stars(1, 13).firstChild);
      a.appendChild(text("span", "sat", data.satisfied));
    } else {
      a.appendChild(text("span", "score", data.score));
      var col = document.createElement("span");
      col.className = "col";
      col.appendChild(stars(data.stars, 11));
      var meta = document.createElement("span");
      meta.className = "meta";
      meta.appendChild(text("b", "", data.satisfied));
      meta.appendChild(document.createTextNode(" · " + data.verified));
      col.appendChild(meta);
      a.appendChild(col);
    }
    root.appendChild(a);
  }

  function load(host) {
    if (host.getAttribute("data-satis-ready")) return;
    host.setAttribute("data-satis-ready", "1");
    var slug = host.getAttribute("data-satis-score") || "";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return;
    var lang = host.getAttribute("data-lang") || (document.documentElement.lang || "ar").slice(0, 2);
    var style = host.getAttribute("data-style") === "small" ? "small" : "full";
    fetch(origin + "/api/score/" + slug + "?lang=" + (lang === "en" ? "en" : "ar"))
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data) render(host, data, style);
      })
      .catch(function () {});
  }

  function scan() {
    document.querySelectorAll("[data-satis-score]").forEach(load);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  else scan();
})();
