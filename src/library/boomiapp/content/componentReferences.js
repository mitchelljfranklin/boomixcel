document.arrive(".component_header .links", { existing: true }, function (linksDiv) {
  if (linksDiv.querySelector(".bph-component-references-btn")) return;
  if (BoomiPlatform.component_references !== "on") return;
  if (!BoomiPlatform.boomi_api_token) return;

  var referencesBtn = document.createElement("a");
  referencesBtn.className = "gwt-Anchor svg-anchor bph-component-references-btn";
  referencesBtn.title = "Component References";
  referencesBtn.href = "javascript:void(0)";
  referencesBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style="width: 24px; height: 24px;"><title>Component References</title><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  referencesBtn.addEventListener("pointerdown", function (buttonClickEvent) {
    buttonClickEvent.stopPropagation();

    var accountId = getUrlParameter("accountId") || "";

    var hash = window.location.hash;
    var componentId = "";
    var componentMatch = hash.match(/componentIdOnFocus=([^;&]+)/);
    if (componentMatch) {
      componentId = componentMatch[1];
    } else {
      var componentsMatch = hash.match(/components=([^;&]+)/);
      if (componentsMatch) componentId = componentsMatch[1].split(",").pop();
    }

    if (!componentId || !accountId) return;

    var modalHtml = renderBoomiModal({
      overlayClass: "BoomiPlatformOverlay",
      modern: true,
      body:
        '<h1>Component References</h1>' +
        '<div class="bph-references-loading"><i class="font_icon icon-spinner before-animate-spin spinner"></i> Loading references...</div>',
      buttons: [
        { id: "bph-references-close", className: "gwt-Button", text: "Close" },
      ],
    });

    document.getElementsByTagName("body")[0].insertAdjacentHTML("beforeend", modalHtml);

    var contentWrapper = document.querySelector(".BoomiPlatformOverlay .popupContent");
    if (contentWrapper) contentWrapper.classList.add("bph-references-modal");

    document.getElementById("bph-references-close").addEventListener("click", function () {
      removeBoomiOverlay("BoomiPlatformOverlay");
    });

    chrome.runtime.sendMessage(
      { type: "GET_COMPONENT_REFERENCES", accountId: accountId, componentId: componentId },
      function (apiResponse) {
        renderReferencesModal(apiResponse);
      },
    );
  });

  // Insert before the monitor link (heartbeat icon)
  var monitorLink = linksDiv.querySelector(".bph-monitor-link");
  if (monitorLink) {
    linksDiv.insertBefore(referencesBtn, monitorLink);
  } else {
    linksDiv.appendChild(referencesBtn);
  }
});

function renderReferencesModal(apiResponse) {
  var loadingBody = document.querySelector(".BoomiPlatformOverlay .bph-references-loading");
  if (!loadingBody) return;

  if (!apiResponse || !apiResponse.success) {
    loadingBody.innerHTML =
      '<div class="qm-c-alert qm-c-alert--info">' +
      (apiResponse ? apiResponse.error : "Failed to load references.") +
      "</div>";
    return;
  }

  var parents = apiResponse.parents || [];
  var children = apiResponse.children || [];
  var accountId = apiResponse.accountId || "";

  function buildUrl(componentId) {
    if (!accountId) return "#";
    return "https://platform.boomi.com/AtomSphere.html#build;accountId=" + accountId + ";components=" + componentId + ";componentIdOnFocus=" + componentId;
  }

  function renderTree(nodes, depth) {
    if (!nodes || nodes.length === 0) return "";
    depth = depth || 0;
    var html = '<ul class="bph-references-tree">';
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var displayName = node.name || node.id;
      var hasChildren = node.children && node.children.length > 0;
      var deletedClass = node.deleted ? ' bph-references-deleted' : '';

      // Tooltip with folder + date
      var tooltipParts = [];
      if (node.folderFullPath) tooltipParts.push(node.folderFullPath);
      if (node.modifiedDate) {
        var dateString = node.modifiedDate.substring(0, 10);
        tooltipParts.push(dateString);
      }
      var tooltip = tooltipParts.length > 0 ? ' title="' + tooltipParts.join(' \u00B7 ') + '"' : '';

      // Build rich node line
      var displayHtml = '<a class="bph-references-link' + deletedClass + '" href="' + buildUrl(node.id) + '" target="_blank"' + tooltip + '>' + displayName + '</a>';
      if (node.componentType) {
        displayHtml += ' <span class="bph-references-component-type">' + formatComponentType(node.componentType) + '</span>';
      }
      if (node.version) {
        displayHtml += ' <span class="bph-references-version">v' + node.version + '</span>';
      }
      displayHtml += ' <span class="bph-references-type bph-references-type-' + (node.type ? node.type.toLowerCase() : "unknown") + '">' + (node.type || "\u2014") + '</span>';
      if (node.deleted) {
        displayHtml += ' <span class="bph-references-deleted-badge">deleted</span>';
      }
      if (hasChildren) {
        displayHtml += ' <span class="bph-references-depth">(' + node.children.length + ")</span>";
      }

      html += '<li class="bph-references-tree-node">';
      if (hasChildren) {
        html += '<details class="bph-references-tree-details"><summary>' + displayHtml + '</summary>';
        html += renderTree(node.children, depth + 1);
        html += '</details>';
      } else {
        html += displayHtml;
      }
      html += '</li>';
    }
    html += '</ul>';
    return html;
  }

  loadingBody.innerHTML =
    (parents.length > 0
      ? '<details class="bph-references-section" open><summary><strong>Used By' + (parents.length > 0 ? " (" + countNodes(parents) + ")" : "") + '</strong></summary>' +
        renderTree(parents) +
        '</details>'
      : "") +
    (children.length > 0
      ? '<details class="bph-references-section" open><summary><strong>References' + (children.length > 0 ? " (" + countNodes(children) + ")" : "") + '</strong></summary>' +
        renderTree(children) +
        '</details>'
      : "") +
    (parents.length === 0 && children.length === 0
      ? '<div class="qm-c-alert qm-c-alert--info">No references found for this component.</div>'
      : "");
}

function formatComponentType(typeName) {
  if (!typeName) return "";
  // Map internal type names to readable labels
  var typeMap = {
    process: "Process",
    webservice: "API Service",
    "webservice.external": "API Proxy",
    flowservice: "Flow Service",
    processroute: "Process Route",
    "transform.map": "Map",
    "transform.function": "Map Function",
    "connector-action": "Connector Action",
    "connector-settings": "Connection",
    crossref: "Cross Reference",
    processproperty: "Process Property",
    queue: "Queue",
    tradingpartner: "Trading Partner",
    tpgroup: "Processing Group",
    tporganization: "Organization",
    tpcommoptions: "Comm Channel",
    certificate: "Certificate",
    "certificate.pgp": "PGP Certificate",
    "profile.db": "DB Profile",
    "profile.edi": "EDI Profile",
    "profile.flatfile": "Flat File Profile",
    "profile.xml": "XML Profile",
    "profile.json": "JSON Profile",
    documentcache: "Document Cache",
    customlibrary: "Custom Library",
    "script.processing": "Process Script",
    "script.mapping": "Map Script",
    xslt: "XSLT Stylesheet",
    documentproperties: "Set Properties",
    notify: "Notify",
    message: "Message",
    programcmd: "Program Command",
    decision: "Decision",
    dataprocess: "Data Process",
    branch: "Branch",
    start: "Start",
    stop: "Stop",
    map: "Map",
    connectoraction: "Connector Action",
  };
  return typeMap[typeName] || typeName;
}

function countNodes(nodes) {
  var total = 0;
  function count(list) {
    for (var i = 0; i < list.length; i++) {
      total++;
      if (list[i].children) count(list[i].children);
    }
  }
  count(nodes);
  return total;
}
