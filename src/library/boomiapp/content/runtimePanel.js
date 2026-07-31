var toggleRuntimePanel = null;

var enableRuntimePanel = function () {
  if (BoomiPlatform.runtime_status_panel === "off") return;
  if (window.location.hash.indexOf("#build") !== 0) return;

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

  // ── Slide-out panel ──────────────────────────────────────────────
  function createPanel() {
    var existing = document.querySelector(".bph-runtime-panel");
    if (existing) return existing;

    var panel = document.createElement("div");
    panel.className = "bph-runtime-panel";

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

      // Expand indicator
      var expandIcon = document.createElement("span");
      expandIcon.className = "bph-runtime-panel-expand-icon";
      expandIcon.textContent = "\u25B8";
      item.appendChild(expandIcon);

      // ── Expandable detail section ──────────────────────────────────
      var detail = document.createElement("div");
      detail.className = "bph-runtime-panel-detail";

      var rows = [];
      rows.push(["Status", r.status + (r.statusDetail ? " (" + r.statusDetail + ")" : "")]);
      rows.push(["Type", r.isCloudAttachment ? "Cloud Attachment" : r.type]);
      rows.push(["Version", r.currentVersion]);
      if (r.hostName) rows.push(["Host", r.hostName]);
      if (r.description) rows.push(["Description", r.description]);
      if (r.instanceId) rows.push(["Instance ID", r.instanceId]);
      if (r.cloudMoleculeName) rows.push(["Cloud Cluster", r.cloudMoleculeName]);
      if (r.cloudName) rows.push(["Cloud", r.cloudName]);
      if (r.cloudOwnerName) rows.push(["Cloud Owner", r.cloudOwnerName]);
      if (r.dateInstalled) {
        var installDate = new Date(r.dateInstalled).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        rows.push(["Date Installed", installDate]);
      }

      for (var k = 0; k < rows.length; k++) {
        var row = document.createElement("div");
        row.className = "bph-runtime-panel-detail-row";

        var label = document.createElement("span");
        label.className = "bph-runtime-panel-detail-label";
        label.textContent = rows[k][0];
        row.appendChild(label);

        var value = document.createElement("span");
        value.className = "bph-runtime-panel-detail-value";
        value.textContent = rows[k][1];
        row.appendChild(value);

        detail.appendChild(row);
      }

      // Copy ID button
      var copyRow = document.createElement("div");
      copyRow.className = "bph-runtime-panel-detail-row";
      var copyLabel = document.createElement("span");
      copyLabel.className = "bph-runtime-panel-detail-label";
      copyLabel.textContent = "Runtime ID";
      copyRow.appendChild(copyLabel);
      var copyValue = document.createElement("span");
      copyValue.className = "bph-runtime-panel-detail-value bph-runtime-panel-detail-id";
      copyValue.textContent = r.id;
      copyValue.title = "Click to copy ID";
      copyValue.addEventListener("click", function (clickEvent) {
        var text = clickEvent.target.textContent;
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        clickEvent.target.classList.add("bph-runtime-copied");
        setTimeout(function () { clickEvent.target.classList.remove("bph-runtime-copied"); }, 1500);
      });
      copyRow.appendChild(copyValue);
      detail.appendChild(copyRow);

      item.appendChild(detail);

      // Click to toggle expand
      item.addEventListener("click", function (event) {
        if (event.target.classList.contains("bph-runtime-panel-detail-id")) return;
        var wasOpen = this.classList.contains("bph-runtime-panel-expanded");
        var allItems = body.querySelectorAll(".bph-runtime-panel-item");
        for (var ai = 0; ai < allItems.length; ai++) {
          allItems[ai].classList.remove("bph-runtime-panel-expanded");
        }
        if (!wasOpen) this.classList.add("bph-runtime-panel-expanded");
      });

      body.appendChild(item);
    }
  }

  // Expose toggle for masthead button
  toggleRuntimePanel = function () {
    var panel = createPanel();
    panelOpen = !panelOpen;
    panel.classList.toggle("bph-runtime-panel-open", panelOpen);
    panel.querySelector(".bph-runtime-panel-body").style.display = panelOpen ? "block" : "none";
  };

  // ── Masthead button injection ──────────────────────────────────────
  document.arrive('[data-testid="product-switcher-button"]', { existing: true }, function (switcherButton) {
    var addonsList = switcherButton.closest("ul");
    if (!addonsList || addonsList.querySelector(".bph-masthead-runtime-item")) return;

    var listItem = document.createElement("li");
    listItem.className = "bph-masthead-runtime-item";

    var link = document.createElement("a");
    link.className = "bph-masthead-runtime-link";
    link.title = "Runtime Status";
    link.href = "#";
    link.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>';

    link.addEventListener("click", function (clickEvent) {
      clickEvent.preventDefault();
      if (toggleRuntimePanel) toggleRuntimePanel();
    });

    listItem.appendChild(link);

    var firstItem = addonsList.querySelector("li");
    if (firstItem) {
      addonsList.insertBefore(listItem, firstItem);
    } else {
      addonsList.appendChild(listItem);
    }
  });

  // ── Click-outside to close ────────────────────────────────────────
  document.addEventListener("click", function (clickEvent) {
    if (!panelOpen) return;
    var panel = document.querySelector(".bph-runtime-panel");
    var mastheadBtn = document.querySelector(".bph-masthead-runtime-link");
    if (!panel) return;
    // Close if click is outside the panel AND outside the masthead button
    if (!panel.contains(clickEvent.target) && !(mastheadBtn && mastheadBtn.contains(clickEvent.target))) {
      toggleRuntimePanel();
    }
  });

  // ── Init ─────────────────────────────────────────────────────────────
  function refresh() {
    fetchRuntimes(function () {
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
