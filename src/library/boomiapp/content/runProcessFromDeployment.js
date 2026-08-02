var BPH_RUN_FROM_DEPLOYMENT_PROCESS = "bph_run_from_deployment_process";
var BPH_RUN_FROM_DEPLOYMENT_ENV = "bph_run_from_deployment_env";

var runFromDeploymentStage = "capture";
var runFromDeploymentEnvName = "";

function bphRunFromDeploymentValid() {
  return !!(chrome.runtime && chrome.runtime.id);
}

(function initRunFromDeployment() {
  if (!bphRunFromDeploymentValid()) return;
})();

setInterval(function () {
  if (BoomiPlatform.run_process_from_deployment !== "on") return;
  if (!BoomiPlatform.boomi_api_token) return;
  if (!bphRunFromDeploymentValid()) return;

  switch (runFromDeploymentStage) {
    case "capture":
      runFromDeploymentCapture();
      break;
    case "inject":
      runFromDeploymentInject();
      break;
    default:
      break;
  }
}, 500);

// ── Stage: CAPTURE — read environment + process name from Deploy Review screen ──

function runFromDeploymentCapture() {
  var reviewScreen = document.getElementById("deploy_review_screen");
  if (!reviewScreen) return;

  var envName = runFromDeploymentEnvName;
  var processName = null;

  var reviewTable = reviewScreen.querySelector(".boomi_standard_table");
  if (reviewTable) {
    var bodyTables = reviewTable.querySelectorAll(".GPGODNGDPL table tbody");
    if (bodyTables.length === 0) {
      bodyTables = reviewTable.querySelectorAll("table tbody");
    }
    for (var bi = 0; bi < bodyTables.length; bi++) {
      var rows = bodyTables[bi].querySelectorAll("tr[__gwt_row]");
      for (var ri = 0; ri < rows.length; ri++) {
        var row = rows[ri];
        var cells = row.querySelectorAll("td");
        if (cells.length < 2) continue;
        var typeDiv = cells[1] ? cells[1].querySelector('div[__gwt_cell] div[data-locator^="cell-"]') : null;
        if (typeDiv && typeDiv.textContent.trim() === "Process") {
          var nameDiv = cells[0] ? cells[0].querySelector('div[__gwt_cell] div[data-locator^="cell-"]') : null;
          if (nameDiv) {
            processName = nameDiv.textContent.trim();
          }
          break;
        }
      }
      if (processName) break;
    }
  }

  if (!processName) return;

  var stored = {};
  stored[BPH_RUN_FROM_DEPLOYMENT_PROCESS] = processName;
  stored[BPH_RUN_FROM_DEPLOYMENT_ENV] = envName || "";
  chrome.storage.local.set(stored);

  runFromDeploymentStage = "inject";
}

// ── Capture environment name from wizard step 1 ──

document.addEventListener("mousedown", function (event) {
  if (BoomiPlatform.run_process_from_deployment !== "on") return;
  if (!BoomiPlatform.boomi_api_token) return;
  if (!bphRunFromDeploymentValid()) return;

  var nextButton = event.target.closest('[data-locator="button-next-select-versions"]');
  if (!nextButton) return;

  var envInput = document.querySelector('[data-locator="formrow-deployment-environment"]');
  if (!envInput) return;

  var envName = envInput.value.trim();
  if (!envName) return;

  runFromDeploymentEnvName = envName;

  var stored = {};
  stored[BPH_RUN_FROM_DEPLOYMENT_ENV] = envName;
  chrome.storage.local.set(stored);
}, true);

// ── Stage: INJECT — add "Run Deployment Now" button to success dialog ──

function runFromDeploymentInject() {
  var successDialog = document.getElementById("popup_on_popup_content_TopModalMessageWidget");
  if (!successDialog) return;

  if (successDialog.querySelector(".bph-run-deploy-now")) return;

  var titleHeading = successDialog.querySelector("h2.form_title_label");
  if (!titleHeading || titleHeading.textContent.trim() !== "Deployment Successful") return;

  chrome.storage.local.get([BPH_RUN_FROM_DEPLOYMENT_PROCESS], function (result) {
    if (!result[BPH_RUN_FROM_DEPLOYMENT_PROCESS]) return;

    var buttonSet = successDialog.querySelector(".button_set");
    if (!buttonSet) return;

    var runButton = document.createElement("button");
    runButton.type = "button";
    runButton.className = "gwt-Button qm-button--primary-action bph-run-deploy-now";
    runButton.textContent = "Run Deployment Now";
    runButton.addEventListener("click", function () {
      runFromDeploymentShowConfirm(successDialog);
    });
    buttonSet.insertBefore(runButton, buttonSet.firstChild);
  });
}

function runFromDeploymentShowConfirm(successDialog) {
  chrome.storage.local.get([BPH_RUN_FROM_DEPLOYMENT_PROCESS, BPH_RUN_FROM_DEPLOYMENT_ENV], function (result) {
    var processName = result[BPH_RUN_FROM_DEPLOYMENT_PROCESS] || "";
    var envName = result[BPH_RUN_FROM_DEPLOYMENT_ENV] || "";

    var bodyHtml = '<p>Navigate to Process Reporting and execute <strong>' + processName + '</strong> now?</p>';
    if (envName) {
      bodyHtml += '<p>Runtime will be selected for environment: <strong>' + envName + '</strong></p>';
    }

    var modalHtml = renderBoomiModal({
      overlayClass: "BoomiPlatformOverlay",
      width: "450px",
      title: "Run Deployment Now",
      showInfoIcon: false,
      alertVariant: "qm-c-alert--none",
      extraBodyClasses: "updated_typography",
      extraPopupClasses: "bph-load-done",
      modern: true,
      body: bodyHtml,
      buttons: [
        { className: "gwt-Button qm-button--primary-action action_button", id: "bph-run-confirm-ok", text: "Run Now" },
        { className: "gwt-Button", text: "Cancel", attrs: ' onclick="javascript:document.querySelector(\'.BoomiPlatformOverlay\').remove();"' },
      ],
    });

    var existing = document.querySelector(".BoomiPlatformOverlay");
    if (existing) existing.remove();
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    document.getElementById("bph-run-confirm-ok").addEventListener("click", function () {
      var confirmOverlay = document.querySelector(".BoomiPlatformOverlay");
      if (confirmOverlay) confirmOverlay.remove();

      var accountId = getAccountId();
      if (!accountId) {
        showToast("Could not determine account ID.", 3000, "error");
        return;
      }

      chrome.storage.local.get([BPH_RUN_FROM_DEPLOYMENT_PROCESS, BPH_RUN_FROM_DEPLOYMENT_ENV], function (stored) {
        var processName = stored[BPH_RUN_FROM_DEPLOYMENT_PROCESS] || "";
        var envName = stored[BPH_RUN_FROM_DEPLOYMENT_ENV] || "";

        runFromDeploymentExecuteApi(accountId, processName, envName, successDialog);
      });
    });
  });
}

function getAccountId() {
  var accountId = getUrlParameter("accountId");
  if (accountId) return accountId;
  var reportingLink = document.querySelector('[data-locator="link-process-reporting"]');
  if (reportingLink && reportingLink.href) {
    accountId = reportingLink.href.split("=").pop().split(";")[0];
  }
  return accountId;
}

function runFromDeploymentExecuteApi(accountId, processName, envName, successDialog) {
  chrome.runtime.sendMessage({
    type: "EXECUTE_PROCESS",
    accountId: accountId,
    processName: processName,
    envName: envName,
  }, function (response) {
    if (!response) {
      showToast("Failed to execute process: no response from background worker.", 5000, "error");
      chrome.storage.local.remove([BPH_RUN_FROM_DEPLOYMENT_PROCESS, BPH_RUN_FROM_DEPLOYMENT_ENV]);
      return;
    }

    if (!response.success) {
      showToast(response.error || "Process execution failed.", 5000, "error");
      chrome.storage.local.remove([BPH_RUN_FROM_DEPLOYMENT_PROCESS, BPH_RUN_FROM_DEPLOYMENT_ENV]);
      return;
    }

    showToast("Process execution submitted: " + processName, 3000, "success");

    successDialog.parentElement.remove();
    var wizardPanel = document.getElementById("popup_on_popup_content_WizardControllerPanel");
    if (wizardPanel) wizardPanel.remove();

    chrome.storage.local.set({ bph_custom_refresh_active: true }, function () {
      localStorage.setItem("bph_reporting_process", processName);
      window.open(
        "https://platform.boomi.com/AtomSphere.html#reporting;accountId=" + accountId,
        "_blank",
      );
    });

    chrome.storage.local.remove([BPH_RUN_FROM_DEPLOYMENT_PROCESS, BPH_RUN_FROM_DEPLOYMENT_ENV]);
  });
}
