/**
 * BizClaw Bootstrap — runs before the main app bundle.
 *
 * 1. Persists gateway auth tokens from URL params to localStorage
 * 2. Watches for any lingering OpenClaw text that the JS-bundle patch
 *    might miss (dynamic content, shadow DOM) and replaces it
 * 3. Auto-clicks "Wait for scan" after WhatsApp QR is shown
 *
 * Uses MutationObserver (efficient) instead of setInterval (fragile).
 */
(function () {
  "use strict";

  // ---- Gateway auth bootstrap (same as OpenClaw's built-in) ----
  var STORAGE_KEY = "openclaw.control.settings.v1";
  var params = new URLSearchParams(window.location.search);
  var urlChanged = false;

  function loadSettings() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveSettings(s) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function bootstrapAuth() {
    var s = loadSettings();
    var token = params.get("token");
    var gatewayUrl = params.get("gatewayUrl");
    var sessionKey = params.get("session");

    if (token) { s.token = token; params.delete("token"); urlChanged = true; }
    if (gatewayUrl) { s.gatewayUrl = gatewayUrl; params.delete("gatewayUrl"); urlChanged = true; }
    else if (!s.gatewayUrl) {
      var ws = window.location.protocol === "https:" ? "wss:" : "ws:";
      s.gatewayUrl = ws + "//" + window.location.host;
    }
    if (sessionKey) {
      s.sessionKey = sessionKey;
      s.lastActiveSessionKey = sessionKey;
      params.delete("session");
      urlChanged = true;
    } else {
      s.sessionKey = s.sessionKey || "main";
      s.lastActiveSessionKey = s.lastActiveSessionKey || s.sessionKey;
    }

    s.theme = s.theme || "dark";
    s.chatShowThinking = s.chatShowThinking !== false;
    saveSettings(s);
  }

  // ---- Branding patcher (catches dynamic/shadow-DOM content) ----

  var BRAND_RULES = [
    // [selector-or-test, patcher]
    // Brand title
    function (node) {
      if (node.classList && node.classList.contains("brand-title") && node.textContent !== "BIZCLAW") {
        node.textContent = "BIZCLAW";
      }
    },
    // Brand subtitle
    function (node) {
      if (node.classList && node.classList.contains("brand-sub") && node.textContent !== "Dashboard") {
        node.textContent = "Dashboard";
      }
    },
    // Logo alt text
    function (node) {
      if (node.tagName === "IMG" && node.alt === "OpenClaw") {
        node.alt = "BizClaw";
      }
    },
    // Doc links
    function (node) {
      if (node.tagName === "A" && node.href && node.href.indexOf("docs.openclaw.ai") !== -1) {
        node.href = "https://bizgenix.in/bizclaw/help";
        node.target = "_blank";
        node.rel = "noreferrer";
      }
    }
  ];

  function patchNode(root) {
    if (!root || !root.querySelectorAll) return;
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      for (var r = 0; r < BRAND_RULES.length; r++) {
        BRAND_RULES[r](all[i]);
      }
    }
  }

  function patchSingle(node) {
    if (!node || node.nodeType !== 1) return;
    for (var r = 0; r < BRAND_RULES.length; r++) {
      BRAND_RULES[r](node);
    }
  }

  // ---- WhatsApp auto-wait (clicks "Wait for scan" after QR shown) ----

  function setupWhatsAppAutoWait(root) {
    if (!root || root.__bcAutoWait) return;
    root.__bcAutoWait = true;

    root.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("button") : null;
      if (!btn) return;
      var label = (btn.textContent || "").trim().toLowerCase();
      if (label === "show qr" || label === "relink") {
        setTimeout(function () {
          var attempts = 0;
          var t = setInterval(function () {
            attempts++;
            var buttons = root.querySelectorAll("button");
            for (var i = 0; i < buttons.length; i++) {
              if ((buttons[i].textContent || "").trim().toLowerCase() === "wait for scan" && !buttons[i].disabled) {
                clearInterval(t);
                buttons[i].click();
                return;
              }
            }
            if (attempts >= 60) clearInterval(t);
          }, 500);
        }, 200);
      }
    }, true);
  }

  // ---- MutationObserver setup ----

  function observeRoot(root) {
    if (!root || root.__bcObserver) return;

    // Initial full patch
    patchNode(root);
    setupWhatsAppAutoWait(root);

    var observer = new MutationObserver(function (mutations) {
      for (var m = 0; m < mutations.length; m++) {
        var added = mutations[m].addedNodes;
        for (var i = 0; i < added.length; i++) {
          var node = added[i];
          patchSingle(node);
          if (node.querySelectorAll) {
            var children = node.querySelectorAll(".brand-title, .brand-sub, img[alt='OpenClaw'], a[href*='docs.openclaw.ai']");
            for (var c = 0; c < children.length; c++) {
              patchSingle(children[c]);
            }
          }
          // Watch shadow roots
          if (node.shadowRoot && !node.shadowRoot.__bcObserver) {
            observeRoot(node.shadowRoot);
          }
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });
    root.__bcObserver = true;
  }

  function init() {
    observeRoot(document.body);

    // Also observe the <openclaw-app> shadow root when it appears
    var app = document.querySelector("openclaw-app");
    if (app && app.shadowRoot) {
      observeRoot(app.shadowRoot);
    } else {
      // Wait for it
      var bodyObs = new MutationObserver(function () {
        var el = document.querySelector("openclaw-app");
        if (el && el.shadowRoot) {
          observeRoot(el.shadowRoot);
          bodyObs.disconnect();
        }
      });
      bodyObs.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ---- Run ----

  bootstrapAuth();

  if (urlChanged) {
    var q = params.toString();
    var next = window.location.pathname + (q ? "?" + q : "") + window.location.hash;
    window.history.replaceState({}, "", next);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
