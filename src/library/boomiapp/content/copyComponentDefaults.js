var applyCopyComponentDefaults = function () {
  if (
    BoomiPlatform.copy_component_name_auto_apply === "off" &&
    BoomiPlatform.copy_component_password_default === "off" &&
    BoomiPlatform.copy_component_dependents_default === "off"
  )
    return;

  document.arrive(
    "[data-locator='formrow-enter-name-here']",
    { existing: true },
    function (nameInput) {
      var dialog = nameInput.closest(".popupContent");
      if (!dialog || dialog.dataset.bphCopyDefaultsApplied) return;
      dialog.dataset.bphCopyDefaultsApplied = true;

      // ── 1. Auto-populate component name ──────────────────────────────
      if (BoomiPlatform.copy_component_name_auto_apply !== "off") {
        var componentNameEl = dialog.querySelector(
          "[data-locator='formrow-component-to-copy']",
        );
        var componentName = componentNameEl
          ? componentNameEl.textContent.trim()
          : "";
        if (componentName) {
          var suffix = BoomiPlatform.copy_component_name_suffix || "";
          nameInput.value = componentName + suffix;
          // GWT TextBox reads value on blur
          nameInput.focus();
          nameInput.blur();
          nameInput.dispatchEvent(new Event("input", { bubbles: true }));
          nameInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      // ── 2. Copy Passwords checkbox ───────────────────────────────────
      var passInput = dialog.querySelector(
        "[data-locator='formrow-copy-passwords-across-all-accounts-input']",
      );
      if (passInput && !passInput.disabled) {
        passInput.checked =
          BoomiPlatform.copy_component_password_default !== "off";
      }

      // ── 3. Copy Component Dependents checkbox ────────────────────────
      var depInput = dialog.querySelector(
        "[data-locator='formrow-copy-component-dependents-input']",
      );
      if (depInput) {
        depInput.checked =
          BoomiPlatform.copy_component_dependents_default !== "off";
      }
    },
  );
};

// BoomiPlatform loads asynchronously — wait for config to be populated
var _copyDefaultsInterval = setInterval(function () {
  if (Object.keys(BoomiPlatform).length > 0) {
    clearInterval(_copyDefaultsInterval);
    applyCopyComponentDefaults();
  }
}, 250);
