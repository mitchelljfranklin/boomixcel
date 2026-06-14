var SAVED_STATE = {};

function getFormState() {
  var state = {};
  document.querySelectorAll(".option").forEach(function (el) {
    if (el.type === "checkbox") {
      if (el.classList.contains("toggle-switch")) {
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
}

document.addEventListener("change", updateDirtyIndicator);
document.addEventListener("input", updateDirtyIndicator);

function showToast(message, duration) {
  duration = duration || 3000;
  var container = document.getElementById("toast-container");
  var toast = document.createElement("div");
  toast.className = "toast-popup";
  toast.innerHTML = message;
  container.appendChild(toast);
  requestAnimationFrame(function () { toast.classList.add("show"); });
  setTimeout(function () {
    toast.classList.remove("show");
    setTimeout(function () { toast.remove(); }, 300);
  }, duration);
}

function save_options() {
  var options = getFormState();
  chrome.storage.sync.set(options, function () {
    SAVED_STATE = getFormState();
    updateDirtyIndicator();
    showToast("<strong>Saved!</strong> Reload the Boomi platform tab for changes to take effect.");
  });
}

function restore_options() {
  var defaults = {};
  document.querySelectorAll(".option").forEach(function (el) {
    var def = el.getAttribute("data-default");
    if (def !== null) {
      defaults[el.name] = el.type === "checkbox" && !el.classList.contains("toggle-switch")
        ? def === "true"
        : def;
    }
  });

  chrome.storage.sync.get(Object.keys(defaults), function (items) {
    document.querySelectorAll(".option").forEach(function (el) {
      var val = items[el.name];
      if (val === undefined) val = defaults[el.name];

      if (el.type === "checkbox") {
        if (el.classList.contains("toggle-switch")) {
          el.checked = val === "on" || val === true;
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
      if (el.classList.contains("toggle-switch")) {
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

document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
document.getElementById("reset").addEventListener("click", reset_defaults);
