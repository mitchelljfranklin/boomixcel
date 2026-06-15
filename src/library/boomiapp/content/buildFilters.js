document.arrive(".filter_popup", function (filteredScreen) {
  chrome.storage.sync.get([
    "Filter_process",
    "Filter_processProp",
    "Filter_crossref",
    "Filter_api_service",
    "apply_process_filters",
  ], function (e) {
    if (e.apply_process_filters !== "on") return;
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

      document.getElementById(matchingprocess.htmlFor).checked = e.Filter_process;
      document.getElementById(matchingproprop.htmlFor).checked = e.Filter_processProp;
      document.getElementById(matchingxref.htmlFor).checked = e.Filter_crossref;
      document.getElementById(matchingapiserv.htmlFor).checked = e.Filter_api_service;
  });
});
