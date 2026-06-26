setInterval(function () {
  var status = BoomiPlatform.log_default_min_status;
  if (!status || status === "off") return;

  var select = document.querySelector(
    '#popup_on_popup_content_LogDialogContents .filterContainer select.gwt-ListBox:not(.bph-log-status-applied)',
  );
  if (!select) return;

  select.classList.add("bph-log-status-applied");

  if (select.value !== status) {
    select.value = status;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
}, 1000);
