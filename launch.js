var TARGET = "log=1&afterglow=run&mode=goldhen";
var CACHE_WAIT_MS = 4000;
var SWAP_KEY = "afterglow.swapped";

var stateEl = document.getElementById("state");
var cacheEl = document.getElementById("cache");
var waitingForCache = false;
var cacheTimer = null;
var gone = false;

var appCache = (function () {
  try { return window.applicationCache || null; } catch (e) { return null; }
})();

function cacheBusy() {
  if (!appCache) return false;
  try {
    return appCache.status === appCache.CHECKING
        || appCache.status === appCache.DOWNLOADING;
  } catch (e) {
    return false;
  }
}

function swapAndReload() {
  var last = 0;
  try { last = parseInt(sessionStorage.getItem(SWAP_KEY) || "0", 10) || 0; } catch (e) {}
  if (Date.now() - last < 10000) return false;
  try { sessionStorage.setItem(SWAP_KEY, String(Date.now())); } catch (e) {}
  try { appCache.swapCache(); } catch (e) {}
  location.reload();
  return true;
}

function cacheNote() {
  if (!cacheEl) return;
  if (!appCache) { cacheEl.textContent = ""; return; }
  var text = "";
  try {
    if (appCache.status === appCache.CHECKING) text = "Checking for updates...";
    else if (appCache.status === appCache.DOWNLOADING) text = "Caching offline files - hold on...";
    else if (appCache.status === appCache.UPDATEREADY) text = "Newer version cached - reloading...";
    else if (appCache.status === appCache.IDLE) {
      text = "Offline cache ready.";
      cacheEl.className = "cacheok";
    }
  } catch (e) {}
  cacheEl.textContent = text;
}

function cacheChanged() {
  cacheNote();
  try {
    if (appCache && appCache.status === appCache.UPDATEREADY) {
      if (swapAndReload()) return;
    }
  } catch (e) {}

  if (waitingForCache && !cacheBusy()) {
    waitingForCache = false;
    start();
  }
}

if (appCache) {
  var events = ["checking", "downloading", "progress", "cached", "noupdate",
                "updateready", "error", "obsolete"];
  for (var e = 0; e < events.length; e++) {
    try { appCache.addEventListener(events[e], cacheChanged, false); } catch (err) {}
  }
}

function offline() {
  try { return navigator.onLine === false; } catch (e) { return false; }
}

function go() {
  if (gone) return;
  gone = true;
  if (cacheTimer !== null) { clearTimeout(cacheTimer); cacheTimer = null; }
  if (stateEl) stateEl.textContent = "Launching GoldHEN...";
  location.href = "exploit.html?" + TARGET;
}

function start() {
  try {
    if (appCache && appCache.status === appCache.UPDATEREADY) {
      if (swapAndReload()) return;
    }
  } catch (e) {}

  if (!offline() && cacheBusy()) {
    waitingForCache = true;
    if (stateEl) stateEl.textContent = "Waiting for cache...";
    cacheNote();
    if (cacheTimer === null) {
      cacheTimer = setTimeout(function () {
        cacheTimer = null;
        if (!gone) go();
      }, CACHE_WAIT_MS);
    }
    return;
  }
  go();
}

cacheNote();
start();
