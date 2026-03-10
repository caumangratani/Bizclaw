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

  function installWhatsAppAutoWait(root) {
    if (!root || root.__bizclawWhatsAppAutoWaitInstalled || !root.addEventListener) {
      return;
    }
    root.__bizclawWhatsAppAutoWaitInstalled = true;

    function buttonLabel(el) {
      return (el && typeof el.textContent === "string" ? el.textContent : "").trim().toLowerCase();
    }

    function isEnabledButton(el, label) {
      return (
        el &&
        el.tagName === "BUTTON" &&
        !el.disabled &&
        buttonLabel(el) === label
      );
    }

    function triggerWaitFlow() {
      var attempts = 0;
      var timer = window.setInterval(function () {
        attempts += 1;
        var buttons = root.querySelectorAll ? root.querySelectorAll("button") : [];
        var waitButton = Array.prototype.find.call(buttons, function (el) {
          return isEnabledButton(el, "wait for scan");
        });

        if (waitButton) {
          window.clearInterval(timer);
          waitButton.click();
          return;
        }

        if (attempts >= 120) {
          window.clearInterval(timer);
        }
      }, 500);
    }

    function findButtonFromEvent(event) {
      var path = typeof event.composedPath === "function" ? event.composedPath() : [];
      for (var i = 0; i < path.length; i += 1) {
        var item = path[i];
        if (item && item.tagName === "BUTTON") {
          return item;
        }
      }
      var target = event.target;
      if (target && typeof target.closest === "function") {
        return target.closest("button");
      }
      return null;
    }

    root.addEventListener(
      "click",
      function (event) {
        var button = findButtonFromEvent(event);
        var label = buttonLabel(button);
        if (label === "show qr" || label === "relink") {
          window.setTimeout(triggerWaitFlow, 150);
        }
      },
      true
    );
  }

  function applyBranding() {
    patchNode(document);
    installWhatsAppAutoWait(document);
    document.querySelectorAll("openclaw-app").forEach(function (el) {
      if (el.shadowRoot) {
        patchNode(el.shadowRoot);
        installWhatsAppAutoWait(el.shadowRoot);
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
