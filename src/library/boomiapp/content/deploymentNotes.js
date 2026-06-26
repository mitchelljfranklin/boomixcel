var DEPLOYMENT_NOTES_TEMP_KEY = "bph_deployment_notes_temp";
var deploymentNotesApplyInFlight = false;

function bphExtensionContextValid() {
  return !!(chrome.runtime && chrome.runtime.id);
}

function getDeploymentNotesTextArea(element) {
  if (!element) return null;
  if (element.tagName === "TEXTAREA") return element;
  return element.querySelector("textarea");
}

document.addEventListener(
  "mousedown",
  function (event) {
    var createButton = event.target.closest(
      '[data-locator="button-create-packaged-component-1"]',
    );
    if (!createButton) return;
    if (BoomiPlatform.deployment_notes_auto_apply !== "on") return;
    if (!bphExtensionContextValid()) return;

    var packageNotesField = document.querySelector(
      '[data-locator="formrow-package-notes-for-all"]',
    );
    var packageNotesTextArea = getDeploymentNotesTextArea(packageNotesField);
    if (!packageNotesTextArea) return;

    var notes = packageNotesTextArea.value;
    if (!notes) return;

    var storedNotes = {};
    storedNotes[DEPLOYMENT_NOTES_TEMP_KEY] = notes;
    chrome.storage.local.set(storedNotes);
  },
  true,
);

setInterval(function () {
  if (BoomiPlatform.deployment_notes_auto_apply !== "on") return;
  if (deploymentNotesApplyInFlight) return;
  if (!bphExtensionContextValid()) return;

  var deploymentNotesField = document.querySelector(
    '[data-locator="formrow-deployment-notes"]:not(.bph-deploy-notes-done)',
  );
  if (!deploymentNotesField) return;

  var deploymentNotesTextArea = getDeploymentNotesTextArea(deploymentNotesField);
  if (!deploymentNotesTextArea) return;

  deploymentNotesApplyInFlight = true;
  chrome.storage.local.get(DEPLOYMENT_NOTES_TEMP_KEY, function (result) {
    deploymentNotesApplyInFlight = false;

    var notes = result[DEPLOYMENT_NOTES_TEMP_KEY];
    if (!notes) return;

    deploymentNotesTextArea.value = notes;
    deploymentNotesTextArea.dispatchEvent(new Event("input", { bubbles: true }));
    deploymentNotesTextArea.dispatchEvent(new Event("change", { bubbles: true }));

    deploymentNotesField.classList.add("bph-deploy-notes-done");
    chrome.storage.local.remove(DEPLOYMENT_NOTES_TEMP_KEY);
  });
}, 1000);
