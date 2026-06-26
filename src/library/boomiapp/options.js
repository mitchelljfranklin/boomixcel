var SAVED_STATE = {};

function getFormState() {
  var state = {};
  document.querySelectorAll(".option").forEach(function (el) {
    if (el.type === "checkbox") {
      if (el.classList.contains("toggle-input")) {
        state[el.name] = el.checked ? "on" : "off";
      } else {
        state[el.name] = el.checked ? el.value : false;
      }
    } else {
      state[el.name] = el.value;
    }
  });
  return state;
}

function isDirty() {
  var current = getFormState();
  var keys = Object.keys(current);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (current[k] !== SAVED_STATE[k]) return true;
  }
  return false;
}

function updateDirtyIndicator() {
  var dirty = isDirty();
  var dots = document.querySelectorAll("#dirty-indicator, #save-dirty-dot");
  dots.forEach(function (d) {
    d.classList.toggle("visible", dirty);
  });
  updateCategoryBadges();
}

function updateCategoryBadges() {
  var current = getFormState();
  document.querySelectorAll(".options-pane").forEach(function (pane) {
    var paneKey = pane.getAttribute("data-pane");
    var changedCount = 0;
    pane.querySelectorAll(".option").forEach(function (control) {
      if (current[control.name] !== SAVED_STATE[control.name]) changedCount++;
    });
    var badge = document.querySelector('.nav-changed-badge[data-badge-for="' + paneKey + '"]');
    if (!badge) return;
    badge.textContent = changedCount > 0 ? String(changedCount) : "";
    badge.classList.toggle("visible", changedCount > 0);
  });
}

document.addEventListener("change", updateDirtyIndicator);
document.addEventListener("input", updateDirtyIndicator);

function restore_options() {
  var defaults = {};
  document.querySelectorAll(".option").forEach(function (el) {
    var def = el.getAttribute("data-default");
    if (def !== null) {
      defaults[el.name] = el.type === "checkbox" && !el.classList.contains("toggle-input")
        ? def === "true"
        : def;
    }
  });

  chrome.storage.sync.get(Object.keys(defaults), function (items) {
    document.querySelectorAll(".option").forEach(function (el) {
      var val = items[el.name];
      if (val === undefined) val = defaults[el.name];

      if (el.type === "checkbox") {
        if (el.classList.contains("toggle-input")) {
          el.checked = val !== "off" && val !== false;
        } else {
          el.checked = val === true || val === el.value;
        }
      } else if (el.value !== undefined) {
        el.value = val;
      }
    });
    SAVED_STATE = getFormState();
    updateDirtyIndicator();
  });
}

function reset_defaults() {
  if (!confirm("Reset all options to their default values?")) return;
  document.querySelectorAll(".option").forEach(function (el) {
    var def = el.getAttribute("data-default");
    if (def === null) return;

    if (el.type === "checkbox") {
      if (el.classList.contains("toggle-input")) {
        el.checked = def === "on" || def === "true";
      } else {
        el.checked = def === "true";
      }
    } else {
      el.value = def;
    }
  });
  updateDirtyIndicator();
  showToast("<strong>Defaults restored.</strong> Click Save to apply.", 4000);
}

function save_options() {
  var options = getFormState();
  chrome.storage.sync.set(options, function () {
    SAVED_STATE = getFormState();
    updateDirtyIndicator();
    showToast("<strong>Saved!</strong> Reload the Boomi platform tab for changes to take effect.");
  });
}

function activatePane(paneKey) {
  document.querySelectorAll(".options-nav-item").forEach(function (item) {
    var active = item.getAttribute("data-pane") === paneKey;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll(".options-pane").forEach(function (pane) {
    pane.classList.toggle("active", pane.getAttribute("data-pane") === paneKey);
  });
}

function applyOptionsSearch(rawQuery) {
  var layout = document.getElementById("options-layout");
  var query = rawQuery.trim().toLowerCase();

  if (!query) {
    exitOptionsSearch();
    return;
  }

  layout.classList.add("searching");
  var anyMatch = false;
  document.querySelectorAll(".options-pane").forEach(function (pane) {
    var paneHasMatch = false;
    pane.querySelectorAll(".option-item").forEach(function (item) {
      var matches = item.textContent.toLowerCase().indexOf(query) !== -1;
      item.classList.toggle("hidden", !matches);
      if (matches) paneHasMatch = true;
    });
    pane.classList.toggle("no-match", !paneHasMatch);
    if (paneHasMatch) anyMatch = true;
  });

  var noResults = document.getElementById("options-no-results");
  if (noResults) noResults.classList.toggle("visible", !anyMatch);
}

function exitOptionsSearch() {
  var layout = document.getElementById("options-layout");
  layout.classList.remove("searching");
  document.querySelectorAll(".option-item.hidden").forEach(function (item) {
    item.classList.remove("hidden");
  });
  document.querySelectorAll(".options-pane.no-match").forEach(function (pane) {
    pane.classList.remove("no-match");
  });
  var noResults = document.getElementById("options-no-results");
  if (noResults) noResults.classList.remove("visible");
}

document.querySelectorAll(".options-nav-item").forEach(function (navItem) {
  navItem.addEventListener("click", function () {
    var searchInput = document.getElementById("options-search");
    if (searchInput) searchInput.value = "";
    exitOptionsSearch();
    activatePane(navItem.getAttribute("data-pane"));
  });
});

var optionsSearchInput = document.getElementById("options-search");
if (optionsSearchInput) {
  optionsSearchInput.addEventListener("input", function (inputEvent) {
    applyOptionsSearch(inputEvent.target.value);
  });
}

var optionsForm = document.querySelector("form");
if (optionsForm) {
  optionsForm.addEventListener("submit", function (submitEvent) {
    submitEvent.preventDefault();
  });
}

document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
document.getElementById("reset").addEventListener("click", reset_defaults);
