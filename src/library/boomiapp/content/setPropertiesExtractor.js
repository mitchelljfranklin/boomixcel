// setPropertiesExtractor.js — one-click extract all shape configurations
// from the build canvas into a modal table. Uses API when available,
// falls back to DOM clicking for Set Properties only.

let extracting = false;

var init_set_properties_extractor = (process) => {
  let nav = process.closest(".component_editor_panel").querySelector(".step_pellete");
  if (!nav || nav.querySelector(".bph-extract-setproperties")) return;

  let buttonHtml = [
    '<a class="gwt-Anchor svg-anchor others_floats bph-extract-setproperties" data-locator="extract-set-properties" title="Process Analysis">',
    '<svg width="40" height="40" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" style="width:40px;height:40px">',
    '<circle cx="20" cy="20" r="19.5" fill="transparent" stroke="currentColor"/>',
    '<g transform="translate(11, 11)">',
    '<path d="M4 3C4 2.44772 4.44772 2 5 2H13C13.5523 2 14 2.44772 14 3V5H4V3Z" fill="currentColor"/>',
    '<rect x="2" y="4" width="14" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>',
    '<line x1="5" y1="7" x2="13" y2="7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
    '<line x1="5" y1="10" x2="13" y2="10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
    '<line x1="5" y1="13" x2="10" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
    '</g></svg></a>',
  ].join("");

  nav.insertAdjacentHTML("beforeend", buttonHtml);

  nav.querySelector(".bph-extract-setproperties").addEventListener("click", async () => {
    if (extracting) {
      showToast("Extraction already in progress...", 2000, "warning");
      return;
    }
    extracting = true;
    var button = nav.querySelector(".bph-extract-setproperties");
    button.classList.add("bph-extracting");

    try {
      if (BoomiPlatform.boomi_api_token) {
        showToast("Analyzing process via API...", 5000, "info");
        var processData = await extractProcessDataViaApi();
        if (processData) {
          showProcessAnalysisModal(processData);
        } else {
          showToast("Failed to fetch process data from API.", 3000, "error");
        }
      } else {
        showToast("Extracting Set Properties via DOM...", 5000, "info");
        var results = await extractAllSetProperties();
        if (results.length === 0) {
          showToast("No Set Properties shapes found on the canvas.", 3000, "warning");
        } else {
          showSetPropertiesModal(results);
        }
      }
    } finally {
      extracting = false;
      button.classList.remove("bph-extracting");
    }
  });
};

// ── API extraction ──────────────────────────────────────────────────

async function extractProcessDataViaApi() {
  var hash = window.location.hash;
  var componentMatch = hash.match(/componentIdOnFocus=([^;&]+)/);
  var componentId = "";
  if (componentMatch) {
    componentId = componentMatch[1];
  } else {
    var componentsMatch = hash.match(/components=([^;&]+)/);
    if (componentsMatch) componentId = componentsMatch[1].split(",").pop();
  }
  if (!componentId) return null;

  var accountId = getUrlParameter("accountId") || "";
  if (!accountId) {
    var accountMatch = hash.match(/accountId=([^;&]+)/);
    if (accountMatch) accountId = accountMatch[1];
  }
  if (!accountId) return null;

  return new Promise(function (resolve) {
    chrome.runtime.sendMessage(
      { type: "GET_COMPONENT_XML", accountId: accountId, componentId: componentId },
      function (response) {
        if (!response || !response.success || !response.xml) {
          resolve(null);
          return;
        }
        resolve(parseProcessDataFromXml(response.xml));
      },
    );
  });
}

function parseProcessDataFromXml(xml) {
  var parser = new DOMParser();
  var xmlDocument;
  try {
    xmlDocument = parser.parseFromString(xml, "text/xml");
  } catch (e) {
    return null;
  }
  if (xmlDocument.querySelector("parsererror")) return null;

  var data = {
    setProperties: [],
    notifications: [],
    messages: [],
    sqlQueries: [],
    decisions: [],
    maps: [],
    scripts: [],
    inventory: {},
    componentName: "",
  };

  var componentTag = xmlDocument.querySelector("Component");
  if (componentTag) {
    data.componentName = componentTag.getAttribute("name") || "";
  }

  var allShapes = xmlDocument.querySelectorAll("shape");
  for (var i = 0; i < allShapes.length; i++) {
    var shape = allShapes[i];
    var shapetype = shape.getAttribute("shapetype") || "";
    var displayName = shape.getAttribute("userlabel") || shape.getAttribute("name") || "";
    var shapeX = shape.getAttribute("x") || "";
    var shapeY = shape.getAttribute("y") || "";

    // Count for inventory
    data.inventory[shapetype] = (data.inventory[shapetype] || 0) + 1;

    switch (shapetype) {
      case "documentproperties":
        extractDocumentProperties(shape, displayName, shapeX, shapeY, data.setProperties);
        break;
      case "notify":
        extractNotify(shape, displayName, shapeX, shapeY, data.notifications);
        break;
      case "message":
        extractMessage(shape, displayName, shapeX, shapeY, data.messages);
        break;
      case "programcmd":
        extractSqlQuery(shape, displayName, shapeX, shapeY, data.sqlQueries);
        break;
      case "decision":
        extractDecision(shape, displayName, shapeX, shapeY, data.decisions);
        break;
      case "map":
        extractMap(shape, displayName, shapeX, shapeY, data.maps);
        break;
      case "dataprocess":
        extractScripting(shape, displayName, shapeX, shapeY, data.scripts);
        break;
    }
  }

  return data;
}

function extractDocumentProperties(shape, displayName, shapeX, shapeY, results) {
  var documentProperties = shape.querySelectorAll("documentproperty");
  for (var j = 0; j < documentProperties.length; j++) {
    var documentProperty = documentProperties[j];
    var nameAttr = documentProperty.getAttribute("name") || "";
    var propertyId = documentProperty.getAttribute("propertyId") || "";
    var parts = nameAttr.split(" - ");
    var propertyType = parts.length > 1 ? parts[0] : nameAttr;
    var propertyName = parts.length > 1 ? parts[1] : nameAttr;
    var paramValues = extractParameterValues(documentProperty);
    results.push({
      displayName: displayName,
      shapeX: shapeX,
      shapeY: shapeY,
      propertyType: propertyType,
      propertyName: propertyName,
      propertyId: propertyId,
      parameters: paramValues,
    });
  }
}

function extractNotify(shape, displayName, shapeX, shapeY, results) {
  var notify = shape.querySelector("notify");
  var title = notify ? (notify.getAttribute("title") || "") : "";
  var message = "";
  var messageEl = shape.querySelector("notifyMessage");
  if (messageEl) message = messageEl.textContent.trim();
  var level = "";
  var levelEl = shape.querySelector("notifyMessageLevel");
  if (levelEl) level = levelEl.textContent.trim();
  results.push({
    displayName: displayName,
    shapeX: shapeX,
    shapeY: shapeY,
    title: title,
    message: message,
    level: level,
  });
}

function extractMessage(shape, displayName, shapeX, shapeY, results) {
  var msgTxt = "";
  var msgEl = shape.querySelector("msgTxt");
  if (msgEl) msgTxt = msgEl.textContent.trim();
  results.push({
    displayName: displayName,
    shapeX: shapeX,
    shapeY: shapeY,
    messageText: msgTxt,
  });
}

function extractSqlQuery(shape, displayName, shapeX, shapeY, results) {
  var sqlEl = shape.querySelector("sqltoexecute");
  if (!sqlEl) return;
  var query = sqlEl.textContent.trim();
  results.push({
    displayName: displayName,
    shapeX: shapeX,
    shapeY: shapeY,
    query: query,
  });
}

function extractDecision(shape, displayName, shapeX, shapeY, results) {
  var decision = shape.querySelector("decision");
  var comparison = decision ? (decision.getAttribute("comparison") || "") : "";
  var values = [];
  var decisionValues = shape.querySelectorAll("decision > decisionvalue");
  for (var k = 0; k < decisionValues.length; k++) {
    var valueType = decisionValues[k].getAttribute("valueType") || "";
    var valueText = "";
    var processParam = decisionValues[k].querySelector("processparameter");
    var profileEl = decisionValues[k].querySelector("profileelement");
    if (processParam) {
      valueText = processParam.getAttribute("processproperty") || "";
      valueType = "process";
    } else if (profileEl) {
      valueText = profileEl.getAttribute("elementName") || profileEl.getAttribute("elementId") || "";
      valueType = "profile";
    } else {
      valueText = valueType;
    }
    values.push({ type: valueType, value: valueText });
  }
  results.push({
    displayName: displayName,
    shapeX: shapeX,
    shapeY: shapeY,
    comparison: comparison,
    values: values,
  });
}

function extractMap(shape, displayName, shapeX, shapeY, results) {
  var mapEl = shape.querySelector("map");
  var mapId = mapEl ? (mapEl.getAttribute("mapId") || "") : "";
  results.push({
    displayName: displayName,
    shapeX: shapeX,
    shapeY: shapeY,
    mapId: mapId,
  });
}

function extractScripting(shape, displayName, shapeX, shapeY, results) {
  var steps = shape.querySelectorAll("dataprocess > step");
  for (var m = 0; m < steps.length; m++) {
    var stepName = steps[m].getAttribute("name") || "";
    if (stepName !== "Custom Scripting") continue;
    var dataprocessscript = steps[m].querySelector("dataprocessscript");
    if (!dataprocessscript) continue;
    var language = dataprocessscript.getAttribute("language") || "";
    var scriptEl = dataprocessscript.querySelector("script");
    var code = scriptEl ? scriptEl.textContent.trim() : "";
    results.push({
      displayName: displayName,
      shapeX: shapeX,
      shapeY: shapeY,
      language: language,
      code: code,
    });
  }
}

function extractParameterValues(documentProperty) {
  var paramValues = [];
  var sourceValues = documentProperty.querySelector("sourcevalues");
  if (!sourceValues) return paramValues;
  var parameterValues = sourceValues.querySelectorAll("parametervalue");
  for (var k = 0; k < parameterValues.length; k++) {
    var paramValue = parameterValues[k];
    var valueType = paramValue.getAttribute("valueType") || "";
    var valueText = "";
    var staticParam = paramValue.querySelector("staticparameter");
    if (staticParam) {
      valueText = staticParam.getAttribute("staticproperty") || "";
    } else {
      var processParam = paramValue.querySelector("processparameter");
      if (processParam) {
        valueText = processParam.getAttribute("processproperty") || "";
      } else {
        var profileElement = paramValue.querySelector("profileelement");
        if (profileElement) {
          valueText = profileElement.getAttribute("elementName") || profileElement.getAttribute("elementId") || "";
        } else {
          var dateParam = paramValue.querySelector("dateparameter");
          if (dateParam) {
            valueText = dateParam.getAttribute("dateparametertype") || "";
          } else {
            valueText = valueType || "";
          }
        }
      }
    }
    if (valueText) {
      paramValues.push(valueType + ": " + valueText);
    } else if (valueType) {
      paramValues.push(valueType);
    }
  }
  return paramValues;
}

// ── DOM extraction (fallback, Set Properties only) ──────────────────

function waitForSelector(selector, textMatch, timeoutMs) {
  return new Promise(resolve => {
    var start = Date.now();
    var timer = setInterval(() => {
      var elements = document.querySelectorAll(selector);
      var found = null;
      if (textMatch !== undefined) {
        found = [...elements].find(el => el.textContent.trim() === textMatch);
      } else if (elements.length > 0) {
        found = elements[0];
      }
      if (found) { clearInterval(timer); resolve(found); }
      else if (Date.now() - start > timeoutMs) { clearInterval(timer); resolve(null); }
    }, 100);
  });
}

function dispatchMouseClick(element) {
  var rect = element.getBoundingClientRect();
  var options = { bubbles: true, cancelable: true, view: window, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, button: 0, buttons: 1 };
  element.dispatchEvent(new MouseEvent('mousedown', options));
  element.dispatchEvent(new MouseEvent('mouseup', options));
  element.dispatchEvent(new MouseEvent('click', options));
}

async function extractAllSetProperties() {
  var images = document.querySelectorAll('img.gwt-Image[title="Set Properties"]');
  var seen = new Set();
  var wrappers = [];
  images.forEach(img => {
    var wrapper = img.closest('.dragdrop-draggable');
    if (wrapper && !seen.has(wrapper)) { seen.add(wrapper); wrappers.push(wrapper); }
  });
  if (wrappers.length === 0) return [];
  var results = [];
  for (var wrapper of wrappers) {
    var alreadySelected = wrapper.classList.contains('dragdrop-selected');
    if (!alreadySelected) dispatchMouseClick(wrapper);
    var panelLabel = await waitForSelector('.mock_form_label', "Properties to Set", 5000);
    if (!panelLabel) continue;
    await new Promise(resolve => setTimeout(resolve, 300));
    var displayNameInput = document.querySelector('input[data-locator="formrow-display-name"]');
    var displayName = displayNameInput ? displayNameInput.value.trim() : '';
    var propertyItems = document.querySelectorAll('.gwt-DataList > tbody .gwt-DataListItem');
    var propertyTexts = [...propertyItems].map(el => el.textContent.trim());
    if (propertyTexts.length === 0) continue;
    var allRows = document.querySelectorAll('.gwt-DataList > tbody tr');
    for (var i = 0; i < propertyTexts.length; i++) {
      var rawText = propertyTexts[i];
      var parts = rawText.split(' - ');
      var propertyType = parts.length > 1 ? parts[0] : rawText;
      var propertyName = parts.length > 1 ? parts[1] : '';
      var row = allRows[i];
      if (row && !row.classList.contains('selected')) {
        var cell = row.querySelector('td');
        if (cell) { dispatchMouseClick(cell); await new Promise(resolve => setTimeout(resolve, 250)); }
      }
      var paramsFound = await waitForSelector('.parameter_value_list_item .parameter_value', undefined, 2000);
      var paramValues = [];
      if (paramsFound) {
        await new Promise(resolve => setTimeout(resolve, 100));
        var paramElements = document.querySelectorAll('.parameter_value_list_item .parameter_value');
        paramValues = [...paramElements].map(el => el.textContent.trim());
      }
      results.push({ displayName: displayName, propertyType: propertyType, propertyName: propertyName, parameters: paramValues });
    }
    var cancelButton = document.querySelector('.anchor_side_panel button[data-locator="button-cancel"]');
    if (cancelButton) { cancelButton.click(); await new Promise(resolve => setTimeout(resolve, 300)); }
  }
  var cancelButton = document.querySelector('.anchor_side_panel button[data-locator="button-cancel"]');
  if (cancelButton) cancelButton.click();
  return results;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function showSetPropertiesModal(results) {
  var nameCounts = {};
  results.forEach(function (row) { if (row.propertyName) nameCounts[row.propertyName] = (nameCounts[row.propertyName] || 0) + 1; });
  var shapeNames = {};
  results.forEach(function (row) { if (row.displayName) shapeNames[row.displayName] = true; });
  var shapeCount = Object.keys(shapeNames).length;
  var hasPropertyIds = results.some(function (row) { return !!row.propertyId; });

  var rowsHtml = results.map(function (row) {
    var params = row.parameters.length > 0 ? row.parameters.map(function (p) { return escapeHtml(p); }).join(', ') : '(none)';
    var duplicateClass = (BoomiPlatform.setprops_highlight_duplicates !== "off" && row.propertyName && nameCounts[row.propertyName] > 1) ? ' bpe-setprops-duplicate' : '';
    var propertyIdCell = hasPropertyIds ? '<td><code>' + escapeHtml(row.propertyId || '—') + '</code></td>' : '';
    return '<tr><td>' + escapeHtml(row.displayName) + '</td><td>' + escapeHtml(row.propertyType) + '</td><td class="' + duplicateClass + '">' + escapeHtml(row.propertyName) + '</td>' + propertyIdCell + '<td>' + params + '</td></tr>';
  }).join('');

  var propertyIdHeader = hasPropertyIds ? '<th>Property ID</th>' : '';
  var bodyHtml = [
    '<div class="bpe-setprops-container">',
    '<table class="bpe-setprops-table">',
    '<thead><tr><th>Property Shape Name</th><th>Property Type</th><th>Property Name</th>' + propertyIdHeader + '<th>Parameters</th></tr></thead>',
    '<tbody>' + rowsHtml + '</tbody>',
    '</table>',
    '<div class="bpe-setprops-footer">',
    '<span class="bpe-setprops-count">' + shapeCount + ' shape' + (shapeCount === 1 ? '' : 's') + ' found, ' + results.length + ' propert' + (results.length === 1 ? 'y' : 'ies') + ' extracted</span>',
    '</div>',
    '</div>',
  ].join('');

  var modalHtml = renderBoomiModal({
    overlayClass: "BoomiPlatformOverlay", width: "800px", title: "Extracted Set Properties",
    showInfoIcon: false, alertVariant: "qm-c-alert--none",
    extraBodyClasses: "bpe-setprops-body", extraPopupClasses: "bpe-setprops-modal", modern: true,
    body: bodyHtml,
    buttons: [
      { className: "gwt-Button qm-button--primary-action action_button", text: "Close", attrs: ' data-locator="link-cancel" onclick="javascript:document.querySelector(\'.BoomiPlatformOverlay\').remove();"' },
      { className: "gwt-Button bpe-setprops-export", id: "bpe-setprops-export-btn", text: "Export to Clipboard" },
    ],
  });

  var existing = document.querySelector(".BoomiPlatformOverlay");
  if (existing) existing.remove();
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  document.getElementById("bpe-setprops-export-btn").addEventListener("click", () => {
    var tsvHeader = hasPropertyIds ? 'Property Shape Name\tProperty Type\tProperty Name\tProperty ID\tParameters\n' : 'Property Shape Name\tProperty Type\tProperty Name\tParameters\n';
    var tsv = tsvHeader;
    results.forEach(row => {
      var params = row.parameters.length > 0 ? row.parameters.join(', ') : '';
      var propertyIdCol = hasPropertyIds ? (row.propertyId || '') + '\t' : '';
      tsv += row.displayName + '\t' + row.propertyType + '\t' + row.propertyName + '\t' + propertyIdCol + params + '\n';
    });
    navigator.clipboard.writeText(tsv).then(() => showToast("Set Properties data copied to clipboard as TSV.", 2500, "success")).catch(() => showToast("Failed to copy to clipboard.", 2500, "error"));
  });
}

// ── Multi-tab Process Analysis Modal (API only) ─────────────────────

function showProcessAnalysisModal(data) {
  var tabs = [];
  if (data.setProperties.length > 0) tabs.push({ id: "setprops", label: "Set Properties (" + data.setProperties.length + ")", content: renderSetPropertiesTab(data) });
  if (data.notifications.length > 0) tabs.push({ id: "notifications", label: "Notify (" + data.notifications.length + ")", content: renderNotificationsTab(data) });
  if (data.messages.length > 0) tabs.push({ id: "messages", label: "Messages (" + data.messages.length + ")", content: renderMessagesTab(data) });
  if (data.sqlQueries.length > 0) tabs.push({ id: "sql", label: "SQL (" + data.sqlQueries.length + ")", content: renderSqlTab(data) });
  if (data.decisions.length > 0) tabs.push({ id: "decisions", label: "Decisions (" + data.decisions.length + ")", content: renderDecisionsTab(data) });
  if (data.maps.length > 0) tabs.push({ id: "maps", label: "Maps (" + data.maps.length + ")", content: renderMapsTab(data) });
  if (data.scripts.length > 0) tabs.push({ id: "scripts", label: "Scripts (" + data.scripts.length + ")", content: renderScriptsTab(data) });
  if (Object.keys(data.inventory).length > 0) tabs.push({ id: "inventory", label: "Inventory (" + Object.keys(data.inventory).length + " types)", content: renderInventoryTab(data) });

  var titleAlt = data.componentName ? data.componentName : "Process Analysis";

  if (tabs.length === 0) {
    showToast("No analysis data found for this process.", 3000, "warning");
    return;
  }

  var tabButtons = tabs.map(function (tab, index) {
    return '<button class="bpe-analysis-tab-btn' + (index === 0 ? ' bpe-analysis-tab-active' : '') + '" data-tab="' + tab.id + '">' + tab.label + '</button>';
  }).join('');

  var tabPanes = tabs.map(function (tab, index) {
    return '<div class="bpe-analysis-tab-pane' + (index === 0 ? ' bpe-analysis-tab-pane-active' : '') + '" data-tab="' + tab.id + '">' + tab.content + '</div>';
  }).join('');

  var bodyHtml = [
    '<div class="bpe-analysis-tabs">',
    tabButtons,
    '</div>',
    '<div class="bpe-analysis-content">',
    tabPanes,
    '</div>',
  ].join('');

  var modalHtml = renderBoomiModal({
    overlayClass: "BoomiPlatformOverlay", width: "900px", title: titleAlt,
    showInfoIcon: false, alertVariant: "qm-c-alert--none",
    extraBodyClasses: "bpe-analysis-body", extraPopupClasses: "bpe-analysis-modal", modern: true,
    body: bodyHtml,
    buttons: [
      { className: "gwt-Button bpe-analysis-export-current", id: "bpe-analysis-export-current", text: "Export Current Tab" },
      { className: "gwt-Button bpe-analysis-export-all", id: "bpe-analysis-export-all", text: "Export All" },
      { className: "gwt-Button qm-button--primary-action action_button", text: "Close", attrs: ' data-locator="link-cancel" onclick="javascript:document.querySelector(\'.BoomiPlatformOverlay\').remove();"' },
    ],
  });

  var existing = document.querySelector(".BoomiPlatformOverlay");
  if (existing) existing.remove();
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Tab switching
  var tabButtonsAll = document.querySelectorAll(".bpe-analysis-tab-btn");
  var tabPanesAll = document.querySelectorAll(".bpe-analysis-tab-pane");
  for (var ti = 0; ti < tabButtonsAll.length; ti++) {
    tabButtonsAll[ti].addEventListener("click", function () {
      var targetTab = this.getAttribute("data-tab");
      for (var tj = 0; tj < tabButtonsAll.length; tj++) tabButtonsAll[tj].classList.remove("bpe-analysis-tab-active");
      for (var tk = 0; tk < tabPanesAll.length; tk++) tabPanesAll[tk].classList.remove("bpe-analysis-tab-pane-active");
      this.classList.add("bpe-analysis-tab-active");
      document.querySelector('.bpe-analysis-tab-pane[data-tab="' + targetTab + '"]').classList.add("bpe-analysis-tab-pane-active");
    });
  }

  // Export current tab
  document.getElementById("bpe-analysis-export-current").addEventListener("click", function () {
    var activePane = document.querySelector(".bpe-analysis-tab-pane-active");
    if (!activePane) return;
    var tabId = activePane.getAttribute("data-tab");
    var tsv = "";
    for (var ti2 = 0; ti2 < tabs.length; ti2++) {
      if (tabs[ti2].id === tabId) {
        tsv = getTabExportTsv(tabs[ti2].id, data);
        break;
      }
    }
    navigator.clipboard.writeText(tsv).then(() => showToast("Current tab copied to clipboard as TSV.", 2500, "success")).catch(() => showToast("Failed to copy.", 2500, "error"));
  });

  // Export all
  document.getElementById("bpe-analysis-export-all").addEventListener("click", function () {
    var allTsv = "";
    for (var ti3 = 0; ti3 < tabs.length; ti3++) {
      var tabTsv = getTabExportTsv(tabs[ti3].id, data);
      if (tabTsv) allTsv += "=== " + tabs[ti3].label + " ===\n" + tabTsv + "\n\n";
    }
    navigator.clipboard.writeText(allTsv).then(() => showToast("All tabs copied to clipboard as TSV.", 2500, "success")).catch(() => showToast("Failed to copy.", 2500, "error"));
  });
}

function getTabExportTsv(tabId, data) {
  switch (tabId) {
    case "setprops":
      var hasIds = data.setProperties.some(function (r) { return !!r.propertyId; });
      var header = hasIds ? "Shape Name\tX\tY\tProperty Type\tProperty Name\tProperty ID\tParameters\n" : "Shape Name\tX\tY\tProperty Type\tProperty Name\tParameters\n";
      var rows = data.setProperties.map(function (r) {
        var params = r.parameters.length > 0 ? r.parameters.join("; ") : "";
        var idCol = hasIds ? (r.propertyId || "") + "\t" : "";
        return r.displayName + "\t" + r.shapeX + "\t" + r.shapeY + "\t" + r.propertyType + "\t" + r.propertyName + "\t" + idCol + params;
      }).join("\n");
      return header + rows;
    case "notifications":
      return "Shape Name\tX\tY\tTitle\tMessage\tLevel\n" + data.notifications.map(function (r) { return r.displayName + "\t" + r.shapeX + "\t" + r.shapeY + "\t" + r.title + "\t" + r.message + "\t" + r.level; }).join("\n");
    case "messages":
      return "Shape Name\tX\tY\tMessage\n" + data.messages.map(function (r) { return r.displayName + "\t" + r.shapeX + "\t" + r.shapeY + "\t" + r.messageText; }).join("\n");
    case "sql":
      return "Shape Name\tX\tY\tQuery\n" + data.sqlQueries.map(function (r) { return r.displayName + "\t" + r.shapeX + "\t" + r.shapeY + "\t" + r.query; }).join("\n");
    case "decisions":
      return "Shape Name\tX\tY\tComparison\tValues\n" + data.decisions.map(function (r) {
        var vals = r.values.map(function (v) { return v.type + ": " + v.value; }).join("; ");
        return r.displayName + "\t" + r.shapeX + "\t" + r.shapeY + "\t" + r.comparison + "\t" + vals;
      }).join("\n");
    case "maps":
      return "Shape Name\tX\tY\tMap ID\n" + data.maps.map(function (r) { return r.displayName + "\t" + r.shapeX + "\t" + r.shapeY + "\t" + r.mapId; }).join("\n");
    case "scripts":
      return "Shape Name\tX\tY\tLanguage\tCode\n" + data.scripts.map(function (r) { return r.displayName + "\t" + r.shapeX + "\t" + r.shapeY + "\t" + r.language + "\t" + r.code; }).join("\n");
    case "inventory":
      return "Shape Type\tCount\n" + Object.keys(data.inventory).map(function (type) { return type + "\t" + data.inventory[type]; }).join("\n");
    default: return "";
  }
}

// ── Tab rendering ────────────────────────────────────────────────────

function shapeTooltip(row) {
  return row.shapeX && row.shapeY ? ' title="at (' + row.shapeX + ', ' + row.shapeY + ')"' : '';
}

function renderSetPropertiesTab(data) {
  var nameCounts = {};
  data.setProperties.forEach(function (r) { if (r.propertyName) nameCounts[r.propertyName] = (nameCounts[r.propertyName] || 0) + 1; });
  var hasPropertyIds = data.setProperties.some(function (r) { return !!r.propertyId; });
  var rows = data.setProperties.map(function (row) {
    var params = row.parameters.length > 0 ? row.parameters.map(function (p) { return escapeHtml(p); }).join(', ') : '(none)';
    var duplicateClass = (BoomiPlatform.setprops_highlight_duplicates !== "off" && row.propertyName && nameCounts[row.propertyName] > 1) ? ' bpe-setprops-duplicate' : '';
    var idCell = hasPropertyIds ? '<td><code>' + escapeHtml(row.propertyId || '—') + '</code></td>' : '';
    return '<tr' + shapeTooltip(row) + '><td>' + escapeHtml(row.displayName) + '</td><td>' + escapeHtml(row.propertyType) + '</td><td class="' + duplicateClass + '">' + escapeHtml(row.propertyName) + '</td>' + idCell + '<td>' + params + '</td></tr>';
  }).join('');
  var idHeader = hasPropertyIds ? '<th>Property ID</th>' : '';
  return '<table class="bpe-setprops-table"><thead><tr><th>Shape</th><th>Type</th><th>Property Name</th>' + idHeader + '<th>Parameters</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function renderNotificationsTab(data) {
  var rows = data.notifications.map(function (row) {
    return '<tr' + shapeTooltip(row) + '><td>' + escapeHtml(row.displayName) + '</td><td>' + escapeHtml(row.title) + '</td><td>' + escapeHtml(row.level) + '</td><td style="max-width:400px;white-space:pre-wrap;word-break:break-word">' + escapeHtml(row.message) + '</td></tr>';
  }).join('');
  return '<table class="bpe-setprops-table"><thead><tr><th>Shape</th><th>Title</th><th>Level</th><th>Message</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function renderMessagesTab(data) {
  var rows = data.messages.map(function (row) {
    return '<tr' + shapeTooltip(row) + '><td>' + escapeHtml(row.displayName) + '</td><td style="max-width:500px;white-space:pre-wrap;word-break:break-word;font-family:monospace;font-size:11px">' + escapeHtml(row.messageText) + '</td></tr>';
  }).join('');
  return '<table class="bpe-setprops-table"><thead><tr><th>Shape</th><th>Message</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function renderSqlTab(data) {
  var rows = data.sqlQueries.map(function (row) {
    return '<tr' + shapeTooltip(row) + '><td>' + escapeHtml(row.displayName) + '</td><td style="max-width:500px;white-space:pre-wrap;word-break:break-word;font-family:monospace;font-size:11px">' + escapeHtml(row.query) + '</td></tr>';
  }).join('');
  return '<table class="bpe-setprops-table"><thead><tr><th>Shape</th><th>SQL Query</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function renderDecisionsTab(data) {
  var rows = data.decisions.map(function (row) {
    var vals = row.values.map(function (v) { return '<span class="bph-decision-value">' + escapeHtml(v.type) + ': ' + escapeHtml(v.value) + '</span>'; }).join('<br/>');
    return '<tr' + shapeTooltip(row) + '><td>' + escapeHtml(row.displayName) + '</td><td>' + escapeHtml(row.comparison) + '</td><td>' + vals + '</td></tr>';
  }).join('');
  return '<table class="bpe-setprops-table"><thead><tr><th>Shape</th><th>Comparison</th><th>Values</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function renderMapsTab(data) {
  var rows = data.maps.map(function (row) {
    return '<tr' + shapeTooltip(row) + '><td>' + escapeHtml(row.displayName) + '</td><td><code>' + escapeHtml(row.mapId) + '</code></td></tr>';
  }).join('');
  return '<table class="bpe-setprops-table"><thead><tr><th>Shape</th><th>Map ID</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function renderScriptsTab(data) {
  var rows = data.scripts.map(function (row) {
    return '<tr' + shapeTooltip(row) + '><td>' + escapeHtml(row.displayName) + '</td><td>' + escapeHtml(row.language) + '</td><td style="max-width:400px;white-space:pre-wrap;word-break:break-word;font-family:monospace;font-size:11px">' + escapeHtml(row.code) + '</td></tr>';
  }).join('');
  return '<table class="bpe-setprops-table"><thead><tr><th>Shape</th><th>Language</th><th>Code</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function renderInventoryTab(data) {
  var types = Object.keys(data.inventory).sort();
  var rows = types.map(function (type) {
    return '<tr><td>' + type + '</td><td>' + data.inventory[type] + '</td></tr>';
  }).join('');
  return '<table class="bpe-setprops-table" style="max-width:300px"><thead><tr><th>Shape Type</th><th>Count</th></tr></thead><tbody>' + rows + '</tbody></table>';
}
