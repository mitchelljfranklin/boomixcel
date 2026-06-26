var SET_PROPERTY_COPY_MENU_CLASS = "bph-copyprop-menu";

document.arrive(".mock_form_label", { existing: true }, function (label) {
  if (label.textContent.trim() !== "Properties to Set") return;

  var panel = label.closest(".canvas_notes_step_panel") || label.closest(".anchor_side_panel");
  if (!panel) return;

  injectSetPropertyCopyControl(panel);
});

function injectSetPropertyCopyControl(panel) {
  var attempts = 0;

  (function tryInject() {
    var editAnchor = findEditPropertyAnchor(panel);
    if (!editAnchor) {
      if (attempts++ < 20) setTimeout(tryInject, 150);
      return;
    }

    var actionRow = editAnchor.parentNode;
    if (!actionRow || actionRow.querySelector(".bph-copy-property")) return;

    var copyAnchor = document.createElement("a");
    copyAnchor.className = "gwt-Anchor svg-anchor floatLeft buttonSpacer bph-copy-property";
    copyAnchor.setAttribute("data-locator", "link-copy-property");
    copyAnchor.setAttribute("href", "javascript:void(0)");
    copyAnchor.setAttribute("title", "Copy Property");
    copyAnchor.innerHTML = SVG_COPY_ICON;

    copyAnchor.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (document.querySelector("." + SET_PROPERTY_COPY_MENU_CLASS)) {
        closeSetPropertyCopyMenu();
      } else {
        openSetPropertyCopyMenu(copyAnchor, panel);
      }
    });

    actionRow.appendChild(copyAnchor);
  })();
}

function findEditPropertyAnchor(panel) {
  var anchors = panel.querySelectorAll('a[data-locator="link-edit"]');
  for (var i = 0; i < anchors.length; i++) {
    var titleElement = anchors[i].querySelector("title");
    if (titleElement && titleElement.textContent.trim() === "Edit Property") {
      return anchors[i];
    }
  }
  return null;
}

function openSetPropertyCopyMenu(anchor, panel) {
  closeSetPropertyCopyMenu();

  var menu = document.createElement("div");
  menu.className = SET_PROPERTY_COPY_MENU_CLASS;

  var nameItem = document.createElement("button");
  nameItem.type = "button";
  nameItem.className = "bph-copyprop-item";
  nameItem.textContent = "Copy property name";
  nameItem.addEventListener("click", function () {
    copySelectedPropertyName(panel);
    closeSetPropertyCopyMenu();
  });

  var valueItem = document.createElement("button");
  valueItem.type = "button";
  valueItem.className = "bph-copyprop-item";
  valueItem.textContent = "Copy property value(s)";
  valueItem.addEventListener("click", function () {
    copySelectedPropertyValues(panel);
    closeSetPropertyCopyMenu();
  });

  menu.appendChild(nameItem);
  menu.appendChild(valueItem);
  document.body.appendChild(menu);

  var rect = anchor.getBoundingClientRect();
  menu.style.top = rect.bottom + window.scrollY + 4 + "px";
  menu.style.left = rect.left + window.scrollX + "px";

  document.addEventListener("click", closeSetPropertyCopyMenuOnOutsideClick, true);
}

function closeSetPropertyCopyMenuOnOutsideClick(event) {
  var menu = document.querySelector("." + SET_PROPERTY_COPY_MENU_CLASS);
  if (!menu) return;
  if (menu.contains(event.target) || event.target.closest(".bph-copy-property")) return;
  closeSetPropertyCopyMenu();
}

function closeSetPropertyCopyMenu() {
  var menu = document.querySelector("." + SET_PROPERTY_COPY_MENU_CLASS);
  if (menu) menu.remove();
  document.removeEventListener("click", closeSetPropertyCopyMenuOnOutsideClick, true);
}

function getSelectedPropertyItem(panel) {
  return panel.querySelector("tr.selected .gwt-DataListItem:not(.parameter_value_list_item)");
}

function copySelectedPropertyName(panel) {
  var selectedItem = getSelectedPropertyItem(panel);
  if (!selectedItem) {
    showToast("Select a property first.", 2500, "warning");
    return;
  }

  var rawText = selectedItem.textContent.trim();
  var parts = rawText.split(" - ");
  var propertyName = parts.length > 1 ? parts.slice(1).join(" - ") : rawText;
  copyTextToClipboard(propertyName, "Property name copied.");
}

function copySelectedPropertyValues(panel) {
  var selectedItem = getSelectedPropertyItem(panel);
  if (!selectedItem) {
    showToast("Select a property first.", 2500, "warning");
    return;
  }

  var valueElements = panel.querySelectorAll(".parameter_value_list_item .parameter_value");
  if (!valueElements.length) {
    showToast("This property has no values to copy.", 2500, "warning");
    return;
  }

  var values = [];
  valueElements.forEach(function (valueElement) {
    values.push(extractRawParameterValue(valueElement.textContent.trim()));
  });

  copyTextToClipboard(values.join("\n"), "Property value(s) copied.");
}

function extractRawParameterValue(displayText) {
  var staticMatch = displayText.match(/^Static value of '([\s\S]*)'$/);
  if (staticMatch) return staticMatch[1];
  return displayText;
}

function copyTextToClipboard(text, successMessage) {
  if (!text) {
    showToast("Nothing to copy.", 2500, "warning");
    return;
  }

  navigator.clipboard.writeText(text).then(function () {
    showToast(successMessage, 2000, "success");
  }).catch(function () {
    var fallbackTextarea = document.createElement("textarea");
    fallbackTextarea.value = text;
    fallbackTextarea.className = "bph-copy-fallback-textarea";
    document.body.appendChild(fallbackTextarea);
    fallbackTextarea.select();
    document.execCommand("copy");
    document.body.removeChild(fallbackTextarea);
    showToast(successMessage, 2000, "success");
  });
}
