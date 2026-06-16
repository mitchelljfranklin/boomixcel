var boomiGptPrompt = null;

function openBoomiGpt(promptText) {
  localStorage.setItem("bph_gpt_prompt", promptText);
  window.open("https://platform.boomi.com/BoomiAI.html#/chat", "_blank");
}

function getComponentId(popup) {
  var componentIdElement = popup.querySelector('[data-locator="formrow-component-id"]');
  return componentIdElement ? componentIdElement.textContent.trim() : "";
}

function getRevisionColumnIndex(popup) {
  var headerCells = popup.querySelectorAll(".headerTable td");
  for (var i = 0; i < headerCells.length; i++) {
    if (headerCells[i].textContent.trim() === "Revision") return i;
  }
  return 0;
}

function updateRevisionSelection(popup) {
  var checked = Array.from(popup.querySelectorAll(".bph-rev-checkbox:checked"));

  if (checked.length > 2) {
    checked[0].checked = false;
    checked = checked.slice(1);
  }

  var gptLink = popup.querySelector(".boomiGptPanel label a, .boomiGptPanel a");
  if (!gptLink) return;

  if (checked.length === 2) {
    var componentId = getComponentId(popup);
    var revisions = checked.map(function (checkbox) {
      return checkbox.dataset.rev;
    }).sort(function (a, b) {
      return Number(a) - Number(b);
    });
    boomiGptPrompt = "compare " + componentId + " version " + revisions[0] + " and " + revisions[1];
    gptLink.classList.add("bph-gpt-link-active");
    gptLink.textContent = "Compare v" + revisions[0] + " and v" + revisions[1] + " \u2192";

    var usingSpan = (gptLink.closest("label") || gptLink.parentElement).querySelector(".bph-gpt-using");
    if (usingSpan) usingSpan.textContent = ": ";
  } else {
    boomiGptPrompt = null;
    gptLink.classList.remove("bph-gpt-link-active");
    gptLink.innerHTML = gptLink.dataset.originalHtml || gptLink.innerHTML;

    var usingSpan = (gptLink.closest("label") || gptLink.parentElement).querySelector(".bph-gpt-using");
    if (usingSpan) usingSpan.textContent = gptLink.dataset.originalUsingText || usingSpan.textContent;
  }
}

document.arrive(".gwt-HistoryPopup", { existing: true }, function (popup) {
  if (popup.classList.contains("bph-rev-hooked")) return;
  popup.classList.add("bph-rev-hooked");

  var dataRows = popup.querySelectorAll(".dataTable tbody tr");
  if (!dataRows.length) return;

  var revisionColumnIndex = getRevisionColumnIndex(popup);

  dataRows.forEach(function (row) {
    var cells = row.querySelectorAll("td");
    var revisionCell = cells[revisionColumnIndex];
    if (!revisionCell) return;
    var revisionNumber = revisionCell.textContent.trim();
    if (!/^\d+$/.test(revisionNumber)) return;

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "bph-rev-checkbox";
    checkbox.dataset.rev = revisionNumber;

    revisionCell.appendChild(checkbox);
  });

  popup.addEventListener("change", function (event) {
    if (event.target.classList.contains("bph-rev-checkbox")) {
      updateRevisionSelection(popup);
    }
  });

  var gptLink = popup.querySelector(".boomiGptPanel label a, .boomiGptPanel a");
  if (!gptLink) return;

  gptLink.dataset.originalHtml = gptLink.innerHTML;
  gptLink.href = "javascript:;";
  gptLink.addEventListener("click", function (clickEvent) {
    clickEvent.preventDefault();
    if (boomiGptPrompt) {
      openBoomiGpt(boomiGptPrompt);
    }
  });

  try {
    var label = gptLink.closest("label") || gptLink.parentElement;
    if (label) {
      var walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
      var textNode;
      while ((textNode = walker.nextNode())) {
        var matchIndex = textNode.textContent.search(/ using/i);
        if (matchIndex !== -1) {
          var afterNode = textNode.splitText(matchIndex);
          var endIndex = afterNode.textContent.search(/[^ using]/i);
          if (endIndex > 0) afterNode.splitText(endIndex);
          var usingSpan = document.createElement("span");
          usingSpan.className = "bph-gpt-using";
          afterNode.parentNode.insertBefore(usingSpan, afterNode);
          usingSpan.appendChild(afterNode);
          gptLink.dataset.originalUsingText = usingSpan.textContent;
          break;
        }
      }
    }
  } catch (err) {}
});

if (window.location.pathname.indexOf("BoomiAI") !== -1) {
  var boomiGptPendingPrompt = localStorage.getItem("bph_gpt_prompt");
  if (boomiGptPendingPrompt) {
    localStorage.removeItem("bph_gpt_prompt");

    var boomiGptAttempts = 0;
    function tryInjectPrompt() {
      boomiGptAttempts++;
      if (boomiGptAttempts > 40) return;

      var textarea = document.querySelector('textarea[placeholder="How can I help you?"]');
      if (!textarea) {
        setTimeout(tryInjectPrompt, 500);
        return;
      }

      var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      nativeSetter.call(textarea, boomiGptPendingPrompt);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      setTimeout(function () {
        var sendButton = document.querySelector('button[data-testid="boomi-gpt-chat-send-button"]');
        if (sendButton) sendButton.click();
      }, 500);
    }
    setTimeout(tryInjectPrompt, 2000);
  }
}
