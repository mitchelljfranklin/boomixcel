document.arrive(".filter_options", { existing: true }, function (filteredScreen) {
  chrome.storage.sync.get([
    "Filter_process",
    "Filter_processProp",
    "Filter_crossref",
    "Filter_api_service",
    "apply_process_filters",
  ], function (prefs) {
    if (prefs.apply_process_filters !== "on") return;
      var matchingxref = document.evaluate(
        "//label[contains(text(),'Cross Reference Table')]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue;
      var matchingprocess = document.evaluate(
        "//label[contains(text(),'Process')]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue;
      var matchingproprop = document.evaluate(
        "//label[contains(text(),'Process Property')]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue;
      var matchingapiserv = document.evaluate(
        "//label[contains(text(),'API Service')]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue;

      document.getElementById(matchingprocess.htmlFor).checked = prefs.Filter_process;
      document.getElementById(matchingproprop.htmlFor).checked = prefs.Filter_processProp;
      document.getElementById(matchingxref.htmlFor).checked = prefs.Filter_crossref;
      document.getElementById(matchingapiserv.htmlFor).checked = prefs.Filter_api_service;
  });
});
