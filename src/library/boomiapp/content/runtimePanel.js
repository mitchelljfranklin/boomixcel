var toggleRuntimePanel = null;

var enableRuntimePanel = function () {
  if (BoomiPlatform.runtime_status_panel === "off") return;
  if (!BoomiPlatform.boomi_api_token) return;
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
      var runtime = runtimes[j];
      var item = document.createElement("div");
      item.className = "bph-runtime-panel-item";

      var statusDot = document.createElement("span");
      statusDot.className = "bph-runtime-panel-status bph-runtime-status-" + runtime.status.toLowerCase();
      statusDot.textContent = "\u25CF";
      item.appendChild(statusDot);

      var info = document.createElement("div");
      info.className = "bph-runtime-panel-info";

      var nameEl = document.createElement("div");
      nameEl.className = "bph-runtime-panel-name";
      nameEl.textContent = runtime.name;
      info.appendChild(nameEl);

      var meta = document.createElement("div");
      meta.className = "bph-runtime-panel-meta";
      meta.textContent = runtime.type + (runtime.currentVersion ? " \u00B7 v" + runtime.currentVersion : "");
      if (runtime.statusDetail) meta.textContent += " \u00B7 " + runtime.statusDetail;
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
      rows.push(["Status", runtime.status + (runtime.statusDetail ? " (" + runtime.statusDetail + ")" : "")]);
      rows.push(["Type", runtime.isCloudAttachment ? "Cloud Attachment" : runtime.type]);
      rows.push(["Version", runtime.currentVersion]);
      if (runtime.hostName) rows.push(["Host", runtime.hostName]);
      if (runtime.description) rows.push(["Description", runtime.description]);
      if (runtime.instanceId) rows.push(["Instance ID", runtime.instanceId]);
      if (runtime.cloudMoleculeName) rows.push(["Cloud Cluster", runtime.cloudMoleculeName]);
      if (runtime.cloudName) rows.push(["Cloud", runtime.cloudName]);
      if (runtime.cloudOwnerName) rows.push(["Cloud Owner", runtime.cloudOwnerName]);
      if (runtime.dateInstalled) {
        var installDate = new Date(runtime.dateInstalled).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
      copyValue.textContent = runtime.id;
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
    var mastheadButton = document.querySelector(".bph-masthead-runtime-link");
    if (!panel) return;
    if (!panel.contains(clickEvent.target) && !(mastheadButton && mastheadButton.contains(clickEvent.target))) {
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
