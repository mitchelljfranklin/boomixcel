var do_refresh = false;

document.addEventListener("click", function (event) {
  var target = event.target;

  if (target.closest("#refresh_reporting button")) {
    event.preventDefault();
    var button = target.closest("#refresh_reporting button");
    if (button.getAttribute("alt") === "off") {
      start_refresh();
      setButtonOnState();
      fireRefresh();
    } else {
      stop_refresh(true);
    }
  }
});

window.addEventListener("hashchange", function () {
  if (!location.href.includes("reporting")) {
    do_refresh = false;
    var element = document.getElementById("refresh_reporting");
    if (element) {
      element.parentNode.removeChild(element);
    }
  }
});

function start_refresh() {
  do_refresh = true;
  chrome.storage.local.set({ bph_custom_refresh_active: true });
  refresh_countdown();
}

function stop_refresh(userInitiated) {
  do_refresh = false;
  if (userInitiated) {
    chrome.storage.local.set({ bph_custom_refresh_active: false });
    resetProcessReportingDurationCountersToZero();
  }
  setButtonOffState();
}

function refresh_countdown() {
  if (!do_refresh) {
    setButtonOffState();
    return;
  }

  var secondsRemaining = BoomiPlatform.refresh_interval;

  function tick() {
    if (!do_refresh) {
      setButtonOffState();
      return;
    }

    var label = document.querySelector("#refresh_reporting .refresh-label");
    if (!label) return;

    secondsRemaining--;

    if (secondsRemaining <= 0) {
      fireRefresh();
      secondsRemaining = BoomiPlatform.refresh_interval;
    }

    label.textContent = "Refreshing in " + padSeconds(secondsRemaining) + "s";
    setTimeout(tick, 1000);
  }

  setTimeout(tick, 1000);
}

function padSeconds(seconds) {
  var padLength = String(BoomiPlatform.refresh_interval).length;
  var display = String(seconds);
  while (display.length < padLength) { display = "0" + display; }
  return display;
}

function fireRefresh() {
  var refreshButton = document.querySelector("button[data-locator=button-refresh]");
  if (!refreshButton) return;
  refreshButton.click();

  var button = document.querySelector("#refresh_reporting button");
  if (!button) return;
  button.classList.add("refresh_pulse");
  button.setAttribute("title", "Last refreshed at " + new Date().toLocaleTimeString());
  setTimeout(function () {
    button.classList.remove("refresh_pulse");
  }, 400);
}

function setButtonOnState() {
  var button = document.querySelector("#refresh_reporting button");
  if (!button) return;
  var label = button.querySelector(".refresh-label");
  if (label) {
    label.textContent = "Refreshing in " + padSeconds(BoomiPlatform.refresh_interval) + "s";
  }
  button.setAttribute("alt", "on");
  button.classList.remove("refresh_primary_action");
  button.classList.add("refresh_doing_action");
  button.blur();
}

function setButtonOffState() {
  var button = document.querySelector("#refresh_reporting button");
  if (!button) return;
  var label = button.querySelector(".refresh-label");
  if (label) {
    label.textContent = "Refresh Every " + BoomiPlatform.refresh_interval + "s";
  }
  button.setAttribute("alt", "off");
  button.classList.remove("refresh_doing_action");
  button.classList.add("refresh_primary_action");
  button.removeAttribute("title");
}

var refreshInterval_listener = function (element) {
  if (BoomiPlatform.refresh_interval === undefined) {
    BoomiPlatform.refresh_interval = 15;
  }

  if (document.getElementById("refresh_reporting")) return;

  $(".reporting_right_side").prepend(
    $(
      '<li id="refresh_reporting">' +
      '<button type="button" class="refresh_primary_action" alt="off">' +
      '<svg class="refresh-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">' +
      '<path d="M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>' +
      '</svg>' +
      '<span class="refresh-label">Refresh Every ' + BoomiPlatform.refresh_interval + 's</span>' +
      '</button>' +
      '</li>',
    ),
  );

  chrome.storage.local.get(["bph_custom_refresh_active"], function (result) {
    if (result.bph_custom_refresh_active) {
      setButtonOnState();
      start_refresh();
    }
  });
};
