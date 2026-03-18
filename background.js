// --- Live Reload (dev only) ---

(function initReload() {
  const RELOAD_SERVER = "ws://localhost:18923";
  let socket = null;
  let connected = false;
  let retryTimer = null;

  function connect() {
    if (socket) return;
    try {
      socket = new WebSocket(RELOAD_SERVER);
    } catch { return schedule(); }

    socket.onopen = () => {
      connected = true;
      console.log("[fence] Dev server connected");
    };
    socket.onmessage = (event) => {
      if (event.data === "reload") {
        console.log("[fence] Reloading extension...");
        chrome.runtime.reload();
      }
    };
    socket.onclose = () => {
      if (connected) console.log("[fence] Dev server disconnected");
      cleanup();
      schedule();
    };
    socket.onerror = () => {
      if (!connected) console.info("[fence] Dev server not running. Run `node dev.mjs` for live reload.");
      socket?.close();
    };
  }

  function cleanup() {
    socket = null;
    connected = false;
  }

  function schedule() {
    if (retryTimer) return;
    retryTimer = setTimeout(() => { retryTimer = null; connect(); }, 3000);
  }

  connect();
})();

// --- Config & Injection ---

async function loadConfig() {
  const url = chrome.runtime.getURL("config.json");
  const resp = await fetch(url);
  return resp.json();
}

async function readFile(path) {
  const url = chrome.runtime.getURL(path);
  const resp = await fetch(url);
  return resp.text();
}

function urlMatchesPattern(url, pattern) {
  // Convert match pattern to regex
  // Supports: *://example.com/* style patterns
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(url);
}

async function injectIntoTab(tabId, url) {
  const config = await loadConfig();

  for (const rule of config.rules) {
    if (!rule.enabled) continue;

    const matches = rule.matches.some((pattern) => urlMatchesPattern(url, pattern));
    if (!matches) continue;

    // Inject CSS files
    if (rule.css) {
      for (const cssPath of rule.css) {
        try {
          const cssText = await readFile(cssPath);
          await chrome.scripting.insertCSS({
            target: { tabId },
            css: cssText,
          });
          console.log(`[fence] Injected CSS: ${cssPath} into ${url}`);
        } catch (err) {
          console.warn(`[fence] Failed to inject CSS ${cssPath}:`, err);
        }
      }
    }

    // Inject JS files
    if (rule.js) {
      for (const jsPath of rule.js) {
        try {
          const jsText = await readFile(jsPath);
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (code) => {
              const script = document.createElement("script");
              script.textContent = code;
              document.documentElement.appendChild(script);
              script.remove();
            },
            args: [jsText],
            world: "MAIN",
          });
          console.log(`[fence] Injected JS: ${jsPath} into ${url}`);
        } catch (err) {
          console.warn(`[fence] Failed to inject JS ${jsPath}:`, err);
        }
      }
    }
  }
}

// --- Session Redirects ---
// Track which tabs have already been redirected (resets when service worker restarts)
const redirectedTabs = new Set();

chrome.webNavigation?.onBeforeNavigate?.addListener((details) => {
  if (details.frameId !== 0) return;
  const url = new URL(details.url);

  // YouTube: redirect homepage to subscriptions once per tab
  if (url.hostname === "www.youtube.com" && url.pathname === "/") {
    if (!redirectedTabs.has(details.tabId)) {
      redirectedTabs.add(details.tabId);
      chrome.tabs.update(details.tabId, {
        url: "https://www.youtube.com/feed/subscriptions",
      });
    }
  }

  // Instagram: redirect homepage to following feed once per tab
  if (url.hostname === "www.instagram.com" && url.pathname === "/" && !url.search.includes("variant=following")) {
    if (!redirectedTabs.has(details.tabId)) {
      redirectedTabs.add(details.tabId);
      chrome.tabs.update(details.tabId, {
        url: "https://www.instagram.com/?variant=following",
      });
    }
  }
});

// Clean up closed tabs
chrome.tabs.onRemoved?.addListener((tabId) => redirectedTabs.delete(tabId));

// Inject on navigation
chrome.webNavigation?.onCompleted?.addListener((details) => {
  if (details.frameId === 0) {
    injectIntoTab(details.tabId, details.url);
  }
});

// Inject on tab update (fallback for Safari which may not support webNavigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    injectIntoTab(tabId, tab.url);
  }
});

console.log("[fence] Background service worker started");
