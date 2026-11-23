// jsonProfileExport.js — add an "Export JSON" button to the component header.
//
// Boomi has no native JSON profile export, so this reads the profile through
// the Component API and offers two downloads:
//   - a Draft 4 JSON Schema
//   - a representative sample JSON document
//
// The button only appears when the open component's type label says
// "JSON Profile" — other component types have nothing to export.

document.arrive(".component_header .name_label", { existing: true }, function (nameLabel) {
  var nameTypeContainer = nameLabel.parentElement;
  syncJsonExportButton(nameTypeContainer);

  if (nameTypeContainer.dataset.bphJsonExportObserved === "true") return;
  nameTypeContainer.dataset.bphJsonExportObserved = "true";

  // GWT can reuse the header and update the type label in place, so watch for
  // changes instead of relying on a single insertion event.
  var headerObserver = new MutationObserver(function () {
    syncJsonExportButton(nameTypeContainer);
  });
  headerObserver.observe(nameTypeContainer, {
    childList: true,
    subtree: true,
    characterData: true,
  });
});

function syncJsonExportButton(nameTypeContainer) {
  if (!nameTypeContainer) return;

  var typeLabel = nameTypeContainer.querySelector(".type_label");
  var componentType = typeLabel ? typeLabel.textContent.trim() : "";
  var isJsonProfile = componentType.indexOf("JSON Profile") === 0;
  var existingButton = nameTypeContainer.querySelector(".bph-json-export-btn");

  if (!isJsonProfile) {
    if (existingButton) existingButton.remove();
    return;
  }

  if (existingButton) return;

  var nameLabel = nameTypeContainer.querySelector(".name_label");
  if (!nameLabel) return;

  var exportButton = document.createElement("a");
  exportButton.className = "gwt-Anchor bph-json-export-btn";
  exportButton.title = "Export JSON Profile (JSON Schema + sample)";
  exportButton.href = "#";
  exportButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
    '<polyline points="7 10 12 15 17 10"/>' +
    '<line x1="12" y1="15" x2="12" y2="3"/>' +
    "</svg>";

  exportButton.addEventListener("click", function (clickEvent) {
    clickEvent.preventDefault();
    startJsonProfileExport();
  });

  nameTypeContainer.insertBefore(exportButton, nameLabel);
}

function startJsonProfileExport() {
  var currentHash = window.location.hash;

  var accountMatch = currentHash.match(/accountId=([^;&]+)/);
  var accountId = accountMatch ? accountMatch[1] : "";

  // componentIdOnFocus is the component in the active build tab. Only fall
  // back to the last entry in components= when it is absent.
  var componentMatch = currentHash.match(/componentIdOnFocus=([^;&]+)/);
  var componentId = componentMatch ? componentMatch[1] : "";
  if (!componentId) {
    var componentsMatch = currentHash.match(/components=([^;&]+)/);
    if (componentsMatch) componentId = componentsMatch[1].split(",").pop();
  }

  if (!componentId || !accountId) {
    showToast("Could not determine the component from the page URL.", 4000, "error");
    return;
  }

  if (!isBoomiApiConfigured()) {
    showBoomiApiSetupModal("JSON profile export");
    return;
  }

  showToast("Fetching JSON profile...", 2500, "info");

  chrome.runtime.sendMessage(
    { type: "GET_COMPONENT_XML", accountId: accountId, componentId: componentId },
    function (apiResponse) {
      if (!apiResponse || !apiResponse.success || !apiResponse.xml) {
        showToast(
          "Could not fetch the component XML" +
            (apiResponse && apiResponse.error ? ": " + apiResponse.error : "."),
          5000,
          "error",
        );
        return;
      }

      var exportData = buildJsonProfileExport(apiResponse.xml);
      if (!exportData.supported) {
        if (exportData.reason === "not-json-profile") {
          showToast(
            "This component is not a JSON profile (type: " +
              (exportData.componentType || "unknown") +
              ").",
            4000,
            "warning",
          );
        } else {
          showToast("Could not read this JSON profile's structure.", 4000, "error");
        }
        return;
      }

      showJsonExportModal(exportData);
    },
  );
}

function showJsonExportModal(exportData) {
  var previewText = exportData.schemaText;
  if (previewText.length > 3000) {
    previewText = previewText.substring(0, 3000) + "\n...";
  }

  var fieldLabel = exportData.fieldCount === 1 ? "field" : "fields";
  var modalHtml = renderBoomiModal({
    overlayClass: "BoomiPlatformOverlay",
    modern: true,
    width: "720px",
    body:
      "<h1>Export JSON Profile</h1>" +
      '<p class="bph-json-export-summary">' +
      escapeJsonExportHtml(exportData.componentName) +
      " \u00b7 " +
      exportData.fieldCount +
      " " +
      fieldLabel +
      "</p>" +
      '<pre class="bph-json-export-preview">' +
      escapeJsonExportHtml(previewText) +
      "</pre>",
    buttons: [
      {
        id: "bph-json-export-schema",
        className: "gwt-Button qm-button--primary-action action_button",
        text: "Download JSON Schema",
      },
      { id: "bph-json-export-sample", className: "gwt-Button", text: "Download Sample JSON" },
      { id: "bph-json-export-close", className: "gwt-Button", text: "Close" },
    ],
  });

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  document.getElementById("bph-json-export-schema").addEventListener("click", function () {
    downloadJsonExportFile(exportData.componentName, "schema", exportData.schemaText);
  });

  document.getElementById("bph-json-export-sample").addEventListener("click", function () {
    downloadJsonExportFile(exportData.componentName, "sample", exportData.sampleText);
  });

  document.getElementById("bph-json-export-close").addEventListener("click", function () {
    removeBoomiOverlay("BoomiPlatformOverlay");
  });
}

function downloadJsonExportFile(componentName, fileSuffix, fileText) {
  var safeName =
    (componentName || "json-profile")
      .replace(/[^a-zA-Z0-9_\- ]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "json-profile";

  var blob = new Blob([fileText], { type: "application/json" });
  var objectUrl = URL.createObjectURL(blob);
  var downloadLink = document.createElement("a");
  downloadLink.href = objectUrl;
  downloadLink.download = safeName + "." + fileSuffix + ".json";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  setTimeout(function () {
    URL.revokeObjectURL(objectUrl);
  }, 1000);

  showToast("Downloaded " + safeName + "." + fileSuffix + ".json");
}

function escapeJsonExportHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
