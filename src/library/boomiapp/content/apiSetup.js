// apiSetup.js — shared guidance for features that need the Boomi Platform API.
//
// API-dependent actions stay visible even when the token is missing. When the
// user tries one, call showBoomiApiSetupModal() so they learn why it is needed
// and how to configure it, instead of hiding the feature or relying on a
// cryptic toolbar badge.

var isBoomiApiConfigured = function () {
  return !!(BoomiPlatform.boomi_api_token && BoomiPlatform.boomi_api_email);
};

var showBoomiApiSetupModal = function (featureName) {
  removeBoomiOverlay("BoomiPlatformOverlay");

  var featureLabel = featureName || "This feature";
  var modalHtml = renderBoomiModal({
    overlayClass: "BoomiPlatformOverlay",
    modern: true,
    width: "560px",
    body:
      "<h1>Boomi API Token Required</h1>" +
      '<p class="bph-api-setup-summary">To use ' +
      featureLabel +
      ", BoomiXcel needs your Boomi email and an API token.</p>" +
      '<ol class="bph-api-setup-steps">' +
      "<li>In Boomi, open <strong>Settings \u2192 API Tokens</strong> and generate a token.</li>" +
      "<li>Open <strong>BoomiXcel Options</strong>: click the toolbar icon and choose <em>Full Settings</em>, or right-click the icon and choose <em>Options</em>.</li>" +
      "<li>Go to the <strong>API</strong> tab, enter your <strong>Boomi API Email</strong> and the <strong>API Token</strong>, then click <strong>Save</strong>.</li>" +
      "<li>Reload the Boomi tab and try again.</li>" +
      "</ol>" +
      '<p class="bph-api-setup-summary">The token needs the access required by each feature. It is stored in <code>chrome.storage.sync</code> and shared across your signed-in browsers.</p>',
    buttons: [{ id: "bph-api-setup-close", className: "gwt-Button", text: "Close" }],
  });

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  document.getElementById("bph-api-setup-close").addEventListener("click", function () {
    removeBoomiOverlay("BoomiPlatformOverlay");
  });
};
