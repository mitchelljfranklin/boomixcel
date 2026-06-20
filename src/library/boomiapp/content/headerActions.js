/**
 * Boomi header bar actions: copy component ID/URL,
 * dismiss update notification overlay, and inject copy-menu items into
 * the full-screen dropdown.
 *
 * All click handlers use a single delegated listener on `document`.
 */

document.addEventListener("click", function (event) {
  const target = event.target;

  // Dashboard date-picker shortcut (7-day default)
  if (target.closest("#gwt-uid-84")) {
    dashboardDays();
    return;
  }

  // Copy the current component ID to the clipboard
  if (target.closest("#copyCompID")) {
    const currentId = getUrlParameter("componentIdOnFocus");
    navigator.clipboard.writeText(currentId).then(function () {
      showInformationAlertDialog(
        "Current ID " + currentId + " Copied to Clipboard.",
      );
    });
    return;
  }

  // Copy a full permalink to the current component to the clipboard
  if (target.closest("#copyCompURL")) {
    const currentId = getUrlParameter("componentIdOnFocus");
    const accountId =
      getUrlParameter("accountId") ||
      document
        .querySelector('[data-locator="link-process-reporting"]')
        .href.split("=")
        .pop()
        .split(";")[0];
    const url =
      "https://platform.boomi.com/AtomSphere.html#build;accountId=" +
      accountId +
      ";components=" +
      currentId;

    navigator.clipboard.writeText(url).then(function () {
      showInformationAlertDialog(
        "Current Component URL Copied to Clipboard. (" + currentId + ")",
      );
    });
    return;
  }

  // Dismiss the per-version update notification overlay
  if (target.closest("#closeUpdate")) {
    const overlay = document.querySelector(".BoomiUpdateOverlay");
    if (overlay) overlay.remove();
    return;
  }

  // Reload the page when settings-changed dialog prompts
  if (target.closest("#reloadPage")) {
    location.reload();
    return;
  }
});

// Inject "Copy Component ID" and "Copy Component URL" menu items
// into the full-screen dropdown once it appears in the DOM.
document.arrive(
  '[data-locator="link-enter-full-screen"]',
  function (element) {
    const ul = element.closest("ul");
    ul.insertAdjacentHTML(
      "beforeend",
      '<li id="copyCompID"><a class="gwt-Anchor">Copy Current Component ID</a></li>',
    );
    ul.insertAdjacentHTML(
      "beforeend",
      '<li id="copyCompURL"><a class="gwt-Anchor">Copy Current Component URL</a></li>',
    );
  },
);

// Inject "View in Process Reporting" link icon next to the Description link on the Build page
document.arrive('[data-locator="link-description"]', { existing: true }, function (descLink) {
  var linksDiv = descLink.closest('.links');
  if (!linksDiv || linksDiv.querySelector('.bph-monitor-link')) return;

  var currentId = getUrlParameter("componentIdOnFocus");
  if (!currentId) return;

  var processReportingEl = document.querySelector('[data-locator="link-process-reporting"]');
  var accountId =
    getUrlParameter("accountId") ||
    (processReportingEl && processReportingEl.href.split("=").pop().split(";")[0]);
  if (!accountId) return;

  var link = document.createElement('a');
  link.className = 'gwt-Anchor svg-anchor bph-monitor-link';
  link.href = 'https://platform.boomi.com/AtomSphere.html#reporting;accountId=' + accountId + ';processes=' + currentId;
  link.title = 'View in Process Reporting';
  link.target = '_blank';
  link.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style="width: 24px; height: 24px;"><title>View in Process Reporting</title><path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  link.addEventListener('mouseenter', function () {
    var currentId = getUrlParameter("componentIdOnFocus");
    if (!currentId) return;
    var processReportingEl = document.querySelector('[data-locator="link-process-reporting"]');
    var accountId =
      getUrlParameter("accountId") ||
      (processReportingEl && processReportingEl.href.split("=").pop().split(";")[0]);
    if (!accountId) return;
    link.href = 'https://platform.boomi.com/AtomSphere.html#reporting;accountId=' + accountId + ';processes=' + currentId;
  });

  descLink.insertAdjacentElement('afterend', link);
});

// Show the Close button after Lock & Edit is clicked
document.arrive('.lockandEditButtonNew', function (lockBtn) {
  lockBtn.addEventListener('click', function () {
    setTimeout(function () {
      var closeBtn = document.querySelector('.save_controls .closeButtonNew');
      if (closeBtn && closeBtn.style.display === 'none') {
        closeBtn.style.display = '';
      }
    }, 200);
  });
});
