const loadScript = (url) => {
  let body = document.getElementsByTagName("body")[0];
  let script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", chrome.runtime.getURL(url));
  body.appendChild(script);
};

loadScript("./library/boomiapp/page/fullscreen.js");

let org_title = document.title;
let wait_for_load = setInterval(() => {
  if (org_title != document.title) {
    clearInterval(wait_for_load);

    updateFullscreenConfig();

    var platformStatus = document.querySelector('a[href*="status.boomi.com"]');
    fetch("https://status.boomi.com/api/v2/status.json")
      .then((res) => res.json())
      .then((out) => {
        var indicator = out.status.indicator || "none";
        var statusClass = "bph-status-" + indicator;
        if (platformStatus) {
          platformStatus.innerHTML =
            '<a href="https://status.boomi.com/" target="_blank">' +
            '<span class="bph-status-dot ' + statusClass + '"></span>' +
            '<span class="bph-status-label">Platform Status:</span> ' +
            '<span class="bph-status-text ' + statusClass + '">' + out.status.description + '</span>' +
            '</a>';
        }

        var footerLinks = document.getElementById("footer_links");
        if (footerLinks) {
          footerLinks.insertAdjacentHTML(
          "afterbegin",
          `
            <li><a class="alternate_link" target="_blank" href="https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko/">BoomiXcel v${chrome.runtime.getManifest().version}</a></li>
            `,
        );
        }

        chrome.storage.sync.get(["mastfoot_show"], function (result) {
          if (result.mastfoot_show === "off") return;
          var mastfoot = document.getElementById("mastfoot");
          if (!mastfoot) return;
          mastfoot.classList.remove("mastfoot-hidden");
          window.dispatchEvent(new Event("resize"));
          new MutationObserver(function () {
            if (mastfoot.classList.contains("mastfoot-hidden")) {
              mastfoot.classList.remove("mastfoot-hidden");
              window.dispatchEvent(new Event("resize"));
            }
          }).observe(mastfoot, { attributeFilter: ["class"] });
        });
      })
      .catch((err) => console.error(err));
  }
}, 250);

const updateFullscreenConfig = () => {
  chrome.storage.sync.get(
    [
      "full_screen_shortcut",
      "full_screen_shortcut_alt",
      "full_screen_shortcut_ctrl",
      "full_screen_shortcut_shift",
    ],
    (config) => {
      window.postMessage(
        Object.assign({ BoomiPlatformconfig: true }, config),
      );
    },
  );
};

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") return;

  chrome.storage.local.get(["bph_suppress_reload_dialog"], function (local) {
    if (local.bph_suppress_reload_dialog) {
      chrome.storage.local.remove("bph_suppress_reload_dialog");
      return;
    }

    let alert_html = renderBoomiModal({
      overlayClass: "BoomiUpdateOverlay",
      body:
        "<h1>Settings Changed.</h1>" +
        "<p>The BoomiXcel extension options have been adjusted, please reload the page for the changes to apply.</p>",
      buttons: [
        { id: "closeUpdate", className: "gwt-Button", text: "Close Message" },
        { id: "reloadPage", className: "gwt-Button", text: "Reload" },
      ],
    });

    removeBoomiOverlay("BoomiUpdateOverlay");
    document
      .getElementsByTagName("body")[0]
      .insertAdjacentHTML("beforeend", alert_html);

    updateFullscreenConfig();
  });
});

// ── Masthead options gear icon ───────────────────────────────────────────────

document.arrive('[data-testid="product-switcher-button"]', { existing: true }, function (switcherButton) {
  var addonsList = switcherButton.closest("ul");
  if (!addonsList || addonsList.querySelector(".bph-masthead-options-item")) return;

  var listItem = document.createElement("li");
  listItem.className = "bph-masthead-options-item";

  var link = document.createElement("a");
  link.className = "bph-masthead-options-link";
  link.title = "BoomiXcel Options";
  link.href = "#";
  link.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

  link.addEventListener("click", function (clickEvent) {
    clickEvent.preventDefault();
    chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
  });

  listItem.appendChild(link);

  var firstItem = addonsList.querySelector("li");
  if (firstItem) {
    addonsList.insertBefore(listItem, firstItem);
  } else {
    addonsList.appendChild(listItem);
  }
});
