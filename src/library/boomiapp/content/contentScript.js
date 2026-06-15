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

    var platformStatus = document.evaluate(
      "//a[text()='Platform Status & Announcements']",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;
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
            <li><a class="alternate_link" target="_blank" href="https://chrome.google.com/webstore/detail/boomi-platform-enhancer/behhfojpggobllhaifocfcampokbfhko/">BoomiXcel v${chrome.runtime.getManifest().version}</a> · <a class="alternate_link" href="#" id="bph-options-link">Options</a></li>
            `,
        );

        document.getElementById("bph-options-link")?.addEventListener("click", function (e) {
          e.preventDefault();
          chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
        });
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

chrome.storage.onChanged.addListener((e) => {
  if (e.headerVisible || e.headerVisible === "false") {
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

function openExensionOptionsPage() {
  window.open(chrome.runtime.getURL("options.html"));
}
