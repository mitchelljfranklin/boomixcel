/*------Global------*/
//Variables
var sPageURL;

/*-------------Global Calling Functions--------------------*/

//Function to retrieve the current URL parameters and split them into each unique record
var getUrlpath = function getUrlpath() {
  sPageURL = $(location).attr("href");
  return sPageURL;
};

//Function to adjust the Dashboard Grids from default to chosen time range
function dashboardDays() {
  var url = getUrlpath();
  if (!url || !url.includes("dashboard")) return;

  var targetRange = (typeof BoomiPlatform !== "undefined" && BoomiPlatform.dashboard_default_range) || "7d";
  var timeSelectors = document.querySelectorAll(".time_range_selector");
  if (timeSelectors.length === 0) return;
  timeSelectors.forEach(function (selector) {
    if (selector.textContent.trim() === targetRange) {
      selector.click();
    }
  });
}

function getUrlParameter(sParam) {
  var sPageURL = $(location).attr("href"),
    sURLVariables = sPageURL.split(";"),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split("=");

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined
        ? true
        : decodeURIComponent(sParameterName[1]);
    }
  }
}

function getPageNameWithoutExtension() {
  return window.location.pathname.split("/").pop().split(".")[0];
}

function getGWTPageName() {
  var urlString = $(location).attr("href");
  var page = urlString.substring(
    urlString.indexOf("#") + 1,
    urlString.indexOf(";"),
  );
  return page;
}

function showInformationAlertDialog(message) {
  $(".context_menu").remove();
  $(".context_menu_glass").remove();
  showToast(message, 3000);
}

function fancyTimeFormat(duration) {
  var hrs = ~~(duration / 3600);
  var mins = ~~((duration % 3600) / 60);
  var secs = ~~duration % 60;
  var ret = "";
  if (hrs > 0) {
    ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
  }
  ret += "" + mins + ":" + (secs < 10 ? "0" : "");
  ret += "" + secs;
  return ret;
}

function getCodeMirrorEditorTheme() {
  var configuredTheme =
    typeof BoomiPlatform !== "undefined" ? BoomiPlatform.codemirror_theme : undefined;
  if (!configuredTheme || configuredTheme === "auto") {
    return $("html").hasClass("qm-u-theme-dark") ? "twilight" : "default";
  }
  return configuredTheme;
}
