var enableRuntimePanel = function () {
  if (BoomiPlatform.runtime_status_panel === "off") return;

  var panelOpen = false;
  var runtimes = [];
  var pollingInterval = null;

  // ── Fetch runtime status from background ────────────────────────────
  function fetchRuntimes(callback) {
    var accountId = getUrlParameter("accountId");
    if (!accountId) {
      accountId = window.location.hash.match(/accountId=([^;&]+)/);
      if (accountId) accountId = accountId[1];
    }
    if (!accountId) return;

    chrome.runtime.sendMessage(
      { type: "GET_RUNTIME_STATUS", accountId: accountId },
      function (response) {
        if (response && response.success) {
          runtimes = response.runtimes || [];
          if (callback) callback();
        }
      },
    );
  }

  // ── Footer dots (Layer 1) ──────────────────────────────────────────
  function renderFooterDots() {
    var existing = document.querySelector(".bph-runtime-footer");
    if (existing) existing.remove();

    if (runtimes.length === 0) return;

    var footer = document.createElement("span");
    footer.className = "bph-runtime-footer";

    for (var i = 0; i < runtimes.length; i++) {
      var dot = document.createElement("span");
      dot.className = "bph-runtime-footer-dot bph-runtime-footer-" + runtimes[i].status.toLowerCase();
      dot.title = runtimes[i].name + " — " + runtimes[i].status + (runtimes[i].statusDetail ? " (" + runtimes[i].statusDetail + ")" : "");
      dot.textContent = "\u25CF";
      footer.appendChild(dot);
    }

    var footerLinks = document.getElementById("footer_links");
    if (footerLinks) {
      footerLinks.appendChild(footer);
    }
  }

  // ── Slide-out panel (Layer 2) ──────────────────────────────────────
  function createPanel() {
    var existing = document.querySelector(".bph-runtime-panel");
    if (existing) return existing;

    var panel = document.createElement("div");
    panel.className = "bph-runtime-panel";

    var toggle = document.createElement("div");
    toggle.className = "bph-runtime-panel-toggle";
    toggle.title = "Runtime Status";
    toggle.textContent = "\u25C0";
    toggle.addEventListener("click", function () {
      panelOpen = !panelOpen;
      toggle.textContent = panelOpen ? "\u25B6" : "\u25C0";
      panel.classList.toggle("bph-runtime-panel-open", panelOpen);
      document.querySelector(".bph-runtime-panel-body").style.display = panelOpen ? "block" : "none";
    });
    panel.appendChild(toggle);

    var body = document.createElement("div");
    body.className = "bph-runtime-panel-body";
    body.style.display = "none";
    panel.appendChild(body);

    document.body.appendChild(panel);
    return panel;
  }

  function renderPanel() {
    var panel = createPanel();
    var body = panel.querySelector(".bph-runtime-panel-body");
    body.innerHTML = "";

    var heading = document.createElement("div");
    heading.className = "bph-runtime-panel-heading";
    heading.textContent = "Runtimes (" + runtimes.length + ")";
    body.appendChild(heading);

    for (var j = 0; j < runtimes.length; j++) {
      var r = runtimes[j];
      var item = document.createElement("div");
      item.className = "bph-runtime-panel-item";

      var statusDot = document.createElement("span");
      statusDot.className = "bph-runtime-panel-status bph-runtime-status-" + r.status.toLowerCase();
      statusDot.textContent = "\u25CF";
      item.appendChild(statusDot);

      var info = document.createElement("div");
      info.className = "bph-runtime-panel-info";

      var nameEl = document.createElement("div");
      nameEl.className = "bph-runtime-panel-name";
      nameEl.textContent = r.name;
      info.appendChild(nameEl);

      var meta = document.createElement("div");
      meta.className = "bph-runtime-panel-meta";
      meta.textContent = r.type + (r.currentVersion ? " \u00B7 v" + r.currentVersion : "");
      if (r.statusDetail) meta.textContent += " \u00B7 " + r.statusDetail;
      info.appendChild(meta);

      item.appendChild(info);
      body.appendChild(item);
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────
  function refresh() {
    fetchRuntimes(function () {
      renderFooterDots();
      renderPanel();
    });
  }

  refresh();
  pollingInterval = setInterval(refresh, 60000);
};

// BoomiPlatform loads asynchronously
var _runtimePanelInterval = setInterval(function () {
  if (Object.keys(BoomiPlatform).length > 0) {
    clearInterval(_runtimePanelInterval);
    enableRuntimePanel();
  }
}, 250);
