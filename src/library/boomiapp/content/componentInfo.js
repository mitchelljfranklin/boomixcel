document.arrive(".component_header .name_label", { existing: true }, function (nameLabel) {
  if (nameLabel.parentElement.querySelector(".bph-component-info-btn")) return;

  var infoButton = document.createElement("a");
  infoButton.className = "gwt-Anchor bph-component-info-btn";
  infoButton.title = "Component Info";
  infoButton.href = "#";
  infoButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

  infoButton.addEventListener("click", function (clickEvent) {
    clickEvent.preventDefault();

    var hash = window.location.hash;
    var params = {};
    hash.replace(/[#;]([^=]+)=([^;&]+)/g, function (_, key, value) {
      params[key] = value;
    });

    var componentId = params.componentIdOnFocus || (params.components ? params.components.split(",").pop() : "");
    var accountId = params.accountId || "";
    var branchName = params.branchName || "";

    var name = nameLabel.textContent.trim();
    var url = window.location.href;

    function copyRow(value) {
      return (
        '<span class="bph-compinfo-copy" title="Click to copy" data-copy="' +
        value.replace(/"/g, "&quot;") +
        '">\uD83D\uDCCB</span>'
      );
    }

    var rows = [];
    rows.push("<tr><td><strong>Component Name</strong></td><td>" + name + "</td></tr>");
    if (componentId) {
      rows.push(
        "<tr><td><strong>Component ID</strong></td><td><code>" +
          componentId +
          "</code> " +
          copyRow(componentId) +
          "</td></tr>",
      );
    }
    if (accountId) {
      rows.push(
        "<tr><td><strong>Account ID</strong></td><td><code>" +
          accountId +
          "</code> " +
          copyRow(accountId) +
          "</td></tr>",
      );
    }
    if (branchName) {
      rows.push("<tr><td><strong>Branch</strong></td><td>" + branchName + "</td></tr>");
    }
    rows.push(
      "<tr><td><strong>Page URL</strong></td><td style='word-break:break-all'>" +
        url +
        " " +
        copyRow(url) +
        "</td></tr>",
    );

    var jsonData = JSON.stringify(
      {
        name: name,
        componentId: componentId,
        accountId: accountId,
        branch: branchName,
        url: url,
      },
      null,
      2,
    );

    var modalHtml = renderBoomiModal({
      overlayClass: "BoomiPlatformOverlay",
      modern: true,
      body:
        "<h1>Component Info</h1>" +
        '<table class="bph-compinfo-table">' +
        rows.join("") +
        "</table>",
      buttons: [
        {
          id: "bph-compinfo-copyjson",
          className: "gwt-Button",
          text: "Copy All as JSON",
        },
        { id: "bph-compinfo-close", className: "gwt-Button", text: "Close" },
      ],
    });

    document
      .getElementsByTagName("body")[0]
      .insertAdjacentHTML("beforeend", modalHtml);

    // Wire up copy-on-click for individual fields
    var copySpans = document.querySelectorAll(".bph-compinfo-copy");
    for (var i = 0; i < copySpans.length; i++) {
      copySpans[i].addEventListener("click", function () {
        var text = this.getAttribute("data-copy");
        navigator.clipboard.writeText(text).catch(function () {
          var textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        });
        this.textContent = "\u2705";
        var self = this;
        setTimeout(function () {
          self.textContent = "\uD83D\uDCCB";
        }, 1500);
      });
    }

    // Wire up "Copy All as JSON" button
    document
      .getElementById("bph-compinfo-copyjson")
      .addEventListener("click", function () {
        navigator.clipboard.writeText(jsonData).catch(function () {
          var textarea = document.createElement("textarea");
          textarea.value = jsonData;
          textarea.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        });
        showToast("Copied component info as JSON");
      });

    // Close button
    document
      .getElementById("bph-compinfo-close")
      .addEventListener("click", function () {
        removeBoomiOverlay("BoomiPlatformOverlay");
      });
  });

  nameLabel.parentElement.insertBefore(infoButton, nameLabel);
});
