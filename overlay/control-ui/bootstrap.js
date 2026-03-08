(function () {
  var STORAGE_KEY = "openclaw.control.settings.v1";
  var params = new URLSearchParams(window.location.search);
  var urlChanged = false;

  function loadSettings() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveSettings(settings) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function normalizeWsUrl() {
    var wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return wsProtocol + "//" + window.location.host;
  }

  function bootstrapGatewaySettings() {
    var settings = loadSettings();
    var token = params.get("token");
    var gatewayUrl = params.get("gatewayUrl");
    var sessionKey = params.get("session");

    if (token) {
      settings.token = token;
      params.delete("token");
      urlChanged = true;
    }

    if (gatewayUrl) {
      settings.gatewayUrl = gatewayUrl;
      params.delete("gatewayUrl");
      urlChanged = true;
    } else if (!settings.gatewayUrl) {
      settings.gatewayUrl = normalizeWsUrl();
    }

    if (sessionKey) {
      settings.sessionKey = sessionKey;
      settings.lastActiveSessionKey = sessionKey;
      params.delete("session");
      urlChanged = true;
    } else {
      settings.sessionKey = settings.sessionKey || "main";
      settings.lastActiveSessionKey = settings.lastActiveSessionKey || settings.sessionKey;
    }

    settings.theme = settings.theme || "dark";
    settings.chatShowThinking = settings.chatShowThinking !== false;
    saveSettings(settings);
  }

  function patchNode(root) {
    if (!root || !root.querySelectorAll) {
      return;
    }

    root.querySelectorAll(".brand-title").forEach(function (el) {
      if (el.textContent !== "BIZCLAW") {
        el.textContent = "BIZCLAW";
      }
      if (el.getAttribute("aria-label") !== "BIZCLAW") {
        el.setAttribute("aria-label", "BIZCLAW");
      }
      if (el.style.fontSize !== "18px") {
        el.style.fontSize = "18px";
      }
      if (el.style.fontWeight !== "700") {
        el.style.fontWeight = "700";
      }
      if (el.style.letterSpacing !== "2px") {
        el.style.letterSpacing = "2px";
      }
    });

    root.querySelectorAll(".brand-sub").forEach(function (el) {
      if (el.textContent !== "Dashboard") {
        el.textContent = "Dashboard";
      }
      if (el.getAttribute("aria-label") !== "Dashboard") {
        el.setAttribute("aria-label", "Dashboard");
      }
      if (el.style.fontSize !== "11px") {
        el.style.fontSize = "11px";
      }
      if (el.style.opacity !== "0.7") {
        el.style.opacity = "0.7";
      }
    });

    root.querySelectorAll('img[alt="OpenClaw"]').forEach(function (el) {
      if (el.getAttribute("alt") !== "BizClaw") {
        el.setAttribute("alt", "BizClaw");
      }
    });

    root.querySelectorAll('a[href^="https://docs.openclaw.ai"]').forEach(function (el) {
      if (el.getAttribute("href") !== "https://website-azure-one-68.vercel.app") {
        el.setAttribute("href", "https://website-azure-one-68.vercel.app");
      }
      if (el.getAttribute("target") !== "_blank") {
        el.setAttribute("target", "_blank");
      }
      if (el.getAttribute("rel") !== "noreferrer") {
        el.setAttribute("rel", "noreferrer");
      }
    });
  }

  function applyBranding() {
    patchNode(document);
    document.querySelectorAll("openclaw-app").forEach(function (el) {
      if (el.shadowRoot) {
        patchNode(el.shadowRoot);
      }
    });
  }

  function installBrandObserver() {
    applyBranding();
    var runs = 0;
    var timer = window.setInterval(function () {
      applyBranding();
      runs += 1;
      if (runs >= 20) {
        window.clearInterval(timer);
      }
    }, 500);
  }

  bootstrapGatewaySettings();

  if (urlChanged) {
    var nextQuery = params.toString();
    var nextUrl = window.location.pathname + (nextQuery ? "?" + nextQuery : "") + window.location.hash;
    window.history.replaceState({}, "", nextUrl);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installBrandObserver, { once: true });
  } else {
    installBrandObserver();
  }
})();
