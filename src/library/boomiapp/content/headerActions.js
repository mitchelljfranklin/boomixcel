/**
 * Boomi header bar actions: show/hide masthead, copy component ID/URL,
 * dismiss update notification overlay, and inject copy-menu items into
 * the full-screen dropdown.
 *
 * All click handlers use a single delegated listener on `document`.
 */

const showHeaderspan = document.getElementById("showHeaderspan");

document.addEventListener("click", function (e) {
  const target = e.target;

  // Toggle masthead visibility and persist preference to chrome.storage.local
  if (target.closest("#showHeaderbtn")) {
    const masthead = document.querySelector(".qm-c-masthead");
    if (!masthead) return;

    chrome.storage.local.get(["headerVisible"], function (result) {
      let headerVisible = result.headerVisible;
      if (typeof headerVisible === "undefined") {
        headerVisible = true;
      }
      if (headerVisible === true) {
        masthead.classList.add("headerHide");
        showHeaderspan.textContent = "Show Header";
        headerVisible = false;
      } else {
        masthead.classList.remove("headerHide");
        showHeaderspan.textContent = "Hide Header";
        headerVisible = true;
      }
      chrome.storage.local.set({ headerVisible: headerVisible });
    });
    return;
  }

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
