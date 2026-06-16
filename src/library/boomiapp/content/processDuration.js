var processExecutionDurationInterval = null;

var processDuration_listener = function (element) {
  if (BoomiPlatform.refresh_interval === undefined) {
    BoomiPlatform.refresh_interval = 15;
  }

  if (processExecutionDurationInterval) {
    clearInterval(processExecutionDurationInterval);
    processExecutionDurationInterval = null;
  }

  processExecutionDurationInterval = setInterval(function () {
    var autoRefreshLabel = Array.from(
      document.querySelectorAll("label"),
    ).find(function (label) {
      return label.textContent.includes("Auto Refresh");
    });
    if (
      (!autoRefreshLabel ||
        (autoRefreshLabel &&
          autoRefreshLabel.innerHTML != "Auto Refresh is On")) &&
      !do_refresh
    ) {
      return;
    }
    if (!window.location.href.includes("#reporting")) {
      clearInterval(processExecutionDurationInterval);
      processExecutionDurationInterval = null;
      return;
    }
    document
      .querySelectorAll('img[title*="In Process"]')
      .forEach(function (element) {
        var inProgressRow = element.parentElement.parentElement.parentElement;
        var processExecutionTime =
          inProgressRow.getElementsByClassName("link_action")[0].innerHTML;
        var diffTime = Math.abs(new Date() - new Date(processExecutionTime));
        var processElapsedTime = inProgressRow.querySelectorAll("div")[11];
        if (!processElapsedTime) return;

        processElapsedTime.innerHTML = fancyTimeFormat(diffTime / 1000);
        inProgressRow.classList.add("bph-processing-row");
        processElapsedTime.classList.add("bph-elapsed-badge", "bph-elapsed-active");
        processElapsedTime.classList.add("bph-elapsed-tick");
        setTimeout(function () {
          if (processElapsedTime) {
            processElapsedTime.classList.remove("bph-elapsed-tick");
          }
        }, 350);
      });
  }, 1000);
};

var resetProcessReportingDurationCountersToZero = function () {
  document
    .querySelectorAll('img[title*="In Process"]')
    .forEach(function (element) {
      var inProgressRow = element.parentElement.parentElement.parentElement;
      var processElapsedTime = inProgressRow.querySelectorAll("div")[11];
      if (!processElapsedTime) return;
      processElapsedTime.innerHTML = "0:00";
      inProgressRow.classList.remove("bph-processing-row");
      processElapsedTime.classList.remove("bph-elapsed-badge", "bph-elapsed-active", "bph-elapsed-tick");
    });
};
