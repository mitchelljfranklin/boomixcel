var TOGGLE_LIST = [
  { key: "canvas_grid", label: "Show Canvas Grid", defaultVal: "on" },
  { key: "path_trace_highlight", label: "Trace Path Highlight", defaultVal: "on" },
  { key: "brand_logo", label: "Replace Boomi Brand Logo", defaultVal: "off" },
  { key: "schedule_icon", label: "Old-Style Play/Pause Icons", defaultVal: "off" },
  { key: "reverse_modal", label: "Reverse Modal Buttons (OK/Cancel)", defaultVal: "off" },
  { key: "mastfoot_show", label: "Show Boomi Footer", defaultVal: "on" },
  { key: "unique_titles_and_favicons", label: "Unique Page Titles & Favicons", defaultVal: "on" },
  { key: "apply_process_filters", label: "Default Process Filters", defaultVal: "off" },
  { key: "reminder_schedule", label: "Post-Deployment Schedule Reminder", defaultVal: "on" },
  { key: "deployment_notes_auto_apply", label: "Deployment Notes Auto-Apply", defaultVal: "off" },
  { key: "log_highlight_warnings", label: "Highlight WARNING Log Lines", defaultVal: "on" },
];

function renderToggles() {
  var list = document.getElementById("toggleList");
  list.innerHTML = "";

  chrome.storage.sync.get(null, function (items) {
    TOGGLE_LIST.forEach(function (item) {
      var val = items[item.key];
      if (val === undefined) val = item.defaultVal;
      var enabled = val === "on" || val === true;

      var row = document.createElement("div");
      row.className = "toggle-item";

      var label = document.createElement("span");
      label.className = "toggle-label";
      label.textContent = item.label;

      var toggle = document.createElement("label");
      toggle.className = "toggle";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.checked = enabled;
      input.addEventListener("change", function () {
        var newVal = this.checked ? "on" : "off";
        var data = {};
        data[item.key] = newVal;
        chrome.storage.local.set({ bph_suppress_reload_dialog: true }, function () {
          chrome.storage.sync.set(data);
        });
        showSavedToast();
      });
      var slider = document.createElement("span");
      slider.className = "slider";
      toggle.appendChild(input);
      toggle.appendChild(slider);

      row.appendChild(label);
      row.appendChild(toggle);
      list.appendChild(row);
    });
  });
}

var toastTimer = null;

function showSavedToast() {
  var existing = document.getElementById("savedToast");
  if (existing) existing.remove();

  var toast = document.createElement("div");
  toast.id = "savedToast";
  toast.className = "saved-toast";
  toast.textContent = "Saved \u2014 reload the Boomi tab to apply";
  document.body.appendChild(toast);

  requestAnimationFrame(function () {
    toast.classList.add("visible");
  });

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("visible");
    setTimeout(function () { toast.remove(); }, 250);
  }, 2000);
}

document.getElementById("versionLabel").textContent =
  "v" + (chrome.runtime.getManifest().version || "0.0.0");

document.getElementById("openOptions").addEventListener("click", function () {
  chrome.runtime.openOptionsPage();
});

document.getElementById("refreshPage").addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) chrome.tabs.reload(tabs[0].id);
    window.close();
  });
});

renderToggles();
